import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { audit, getEntity, listEntities, putEntity } from '../db/index.ts'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import type { FundingRequest, StartupEvaluation } from '../types.ts'

export const investorRouter: ReturnType<typeof Router> = Router()

investorRouter.use(requireAuth)

interface InvestorInterest {
  id: string
  investorId: string
  investorName: string
  startupId: string
  startupName: string
  amountRial: number
  note: string
  status: 'اعلام علاقه' | 'در حال مذاکره' | 'قرارداد' | 'انصراف'
  createdAt: string
}

investorRouter.get('/startups', requirePermission('startups:read:all'), (req, res) => {
  const q = String(req.query.q ?? '').trim()
  const minScore = Number(req.query.minScore ?? 0)
  let rows = listEntities<StartupEvaluation>('startups')
  if (q) rows = rows.filter((s) => s.teamName.includes(q) || s.ideaTitle.includes(q))
  if (minScore) rows = rows.filter((s) => s.aiFinalScore >= minScore)
  res.json(rows.sort((a, b) => b.aiFinalScore - a.aiFinalScore))
})

investorRouter.get('/startups/:id', requirePermission('startups:read:all'), (req, res) => {
  const s = getEntity<StartupEvaluation>('startups', req.params.id)
  if (!s) {
    res.status(404).json({ error: 'استارتاپ یافت نشد' })
    return
  }
  res.json(s)
})

investorRouter.get('/funding', requirePermission('funding:read:all'), (_req, res) => {
  res.json(listEntities<FundingRequest>('fundingRequests'))
})

const interestSchema = z.object({
  startupId: z.string().min(1),
  amountRial: z.number().positive(),
  note: z.string().optional(),
})

investorRouter.post('/interests', requirePermission('investment:express-interest'), (req, res) => {
  const parsed = interestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'اطلاعات نامعتبر است' })
    return
  }
  const startup = getEntity<StartupEvaluation>('startups', parsed.data.startupId)
  if (!startup) {
    res.status(404).json({ error: 'استارتاپ یافت نشد' })
    return
  }
  const dup = listEntities<InvestorInterest>('investorInterests').find(
    (i) => i.investorId === req.auth!.userId && i.startupId === startup.id && i.status !== 'انصراف',
  )
  if (dup) {
    res.status(409).json({ error: 'قبلاً برای این استارتاپ اعلام علاقه کرده‌اید' })
    return
  }
  const interest: InvestorInterest = {
    id: randomUUID(),
    investorId: req.auth!.userId,
    investorName: req.auth!.name,
    startupId: startup.id,
    startupName: startup.teamName,
    amountRial: parsed.data.amountRial,
    note: parsed.data.note ?? '',
    status: 'اعلام علاقه',
    createdAt: new Date().toISOString(),
  }
  putEntity('investorInterests', interest.id, null, interest)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'investment.express-interest', target: startup.id })
  res.status(201).json(interest)
})

investorRouter.get('/interests', requirePermission('investment:read'), (req, res) => {
  const mine = listEntities<InvestorInterest>('investorInterests').filter(
    (i) => i.investorId === req.auth!.userId,
  )
  const portfolio = mine.map((i) => ({
    ...i,
    startup: getEntity<StartupEvaluation>('startups', i.startupId),
  }))
  res.json({
    interests: mine,
    portfolio,
    totalCommittedRial: mine
      .filter((i) => i.status !== 'انصراف')
      .reduce((s, i) => s + i.amountRial, 0),
  })
})

investorRouter.post('/interests/:id/withdraw', requirePermission('investment:express-interest'), (req, res) => {
  const interest = getEntity<InvestorInterest>('investorInterests', req.params.id)
  if (!interest || interest.investorId !== req.auth!.userId) {
    res.status(404).json({ error: 'مورد یافت نشد' })
    return
  }
  interest.status = 'انصراف'
  putEntity('investorInterests', interest.id, null, interest)
  res.json({ ok: true, interest })
})
