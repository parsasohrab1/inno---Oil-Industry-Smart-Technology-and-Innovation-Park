import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { audit, getEntity, listEntities, putEntity } from '../db/index.ts'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import type { MentoringEngagement } from '../types.ts'

export const mentorRouter: ReturnType<typeof Router> = Router()

mentorRouter.use(requireAuth)

interface MentorSession {
  id: string
  engagementId: string
  mentorName: string
  companyId: string
  date: string
  durationMinutes: number
  notes: string
  createdAt: string
}

function myEngagements(name: string): MentoringEngagement[] {
  return listEntities<MentoringEngagement>('mentoring').filter((m) => m.mentorName === name)
}

mentorRouter.get('/mentees', requirePermission('mentoring:read:assigned'), (req, res) => {
  res.json(myEngagements(req.auth!.name))
})

mentorRouter.get('/sessions', requirePermission('mentoring:read:assigned'), (req, res) => {
  const mine = new Set(myEngagements(req.auth!.name).map((m) => m.id))
  res.json(listEntities<MentorSession>('mentoringSessions').filter((s) => mine.has(s.engagementId)))
})

const progressSchema = z.object({
  progressPercent: z.number().int().min(0).max(100),
  status: z.enum(['در حال انجام', 'تکمیل‌شده', 'برنامه‌ریزی‌شده', 'متوقف']).optional(),
  nextSession: z.string().date().optional(),
})

mentorRouter.patch('/mentees/:id', requirePermission('mentoring:update-progress'), (req, res) => {
  const eng = getEntity<MentoringEngagement>('mentoring', req.params.id)
  if (!eng || eng.mentorName !== req.auth!.name) {
    res.status(404).json({ error: 'مسیر منتورینگ یافت نشد' })
    return
  }
  const parsed = progressSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'اطلاعات نامعتبر است' })
    return
  }
  eng.progressPercent = parsed.data.progressPercent
  if (parsed.data.status) eng.status = parsed.data.status
  if (parsed.data.nextSession) eng.nextSession = parsed.data.nextSession
  if (eng.progressPercent === 100) eng.status = 'تکمیل‌شده'
  putEntity('mentoring', eng.id, eng.companyId, eng)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'mentoring.update-progress', target: eng.id })
  res.json({ ok: true, engagement: eng })
})

const sessionSchema = z.object({
  engagementId: z.string().min(1),
  date: z.string().date(),
  durationMinutes: z.number().int().min(15).max(480),
  notes: z.string().min(3),
})

mentorRouter.post('/sessions', requirePermission('mentoring:log-session'), (req, res) => {
  const parsed = sessionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'اطلاعات جلسه نامعتبر است', details: parsed.error.flatten() })
    return
  }
  const eng = getEntity<MentoringEngagement>('mentoring', parsed.data.engagementId)
  if (!eng || eng.mentorName !== req.auth!.name) {
    res.status(404).json({ error: 'مسیر منتورینگ یافت نشد یا متعلق به شما نیست' })
    return
  }
  const session: MentorSession = {
    id: randomUUID(),
    engagementId: eng.id,
    mentorName: req.auth!.name,
    companyId: eng.companyId,
    date: parsed.data.date,
    durationMinutes: parsed.data.durationMinutes,
    notes: parsed.data.notes,
    createdAt: new Date().toISOString(),
  }
  putEntity('mentoringSessions', session.id, eng.companyId, session)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'mentoring.log-session', target: session.id })
  res.status(201).json(session)
})
