import { Router } from 'express'
import { z } from 'zod'
import { audit, getEntity, listEntities, putEntity } from '../db/index.ts'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import {
  appendContractEvent,
  contractEvents,
  getContract,
  runContractConditions,
  saveContract,
  sha256,
  verifyContractChain,
} from '../lib/contracts.ts'
import type { Company, Contract, RentalInvoice } from '../types.ts'

export const contractsRouter: ReturnType<typeof Router> = Router()

contractsRouter.use(requireAuth)

contractsRouter.get('/', requirePermission('contracts:read:all'), (_req, res) => {
  res.json(listEntities<Contract>('contracts'))
})

contractsRouter.get('/:id', requirePermission('contracts:read:all'), (req, res) => {
  const contract = getContract(req.params.id)
  if (!contract) {
    res.status(404).json({ error: 'قرارداد یافت نشد' })
    return
  }
  res.json({
    contract,
    events: contractEvents(contract.id),
    chain: verifyContractChain(contract.id),
  })
})

const createSchema = z.object({
  companyId: z.string().min(1),
  areaM2: z.number().positive(),
  ratePerM2: z.number().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  autoRenew: z.boolean().default(true),
  penaltyRatePerMonth: z.number().min(0).max(1).default(0.02),
})

contractsRouter.post('/', requirePermission('contracts:create'), (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'اطلاعات قرارداد نامعتبر است', details: parsed.error.flatten() })
    return
  }
  const company = getEntity<Company>('companies', parsed.data.companyId)
  if (!company) {
    res.status(400).json({ error: 'شرکت یافت نشد' })
    return
  }
  const now = new Date().toISOString()
  const monthlyRent = Math.round(parsed.data.areaM2 * parsed.data.ratePerM2)
  const contract: Contract = {
    id: `CT-${parsed.data.companyId}-${Date.now()}`,
    companyId: company.id,
    companyName: company.name,
    title: `قرارداد اجاره فضای پارک فناوری نفت — ${company.name}`,
    areaM2: parsed.data.areaM2,
    ratePerM2: parsed.data.ratePerM2,
    monthlyRent,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    autoRenew: parsed.data.autoRenew,
    penaltyRatePerMonth: parsed.data.penaltyRatePerMonth,
    state: 'pending_signatures',
    signatures: [],
    createdAt: now,
    updatedAt: now,
  }
  putEntity('contracts', contract.id, contract.companyId, contract)
  appendContractEvent(
    contract.id,
    'created',
    { areaM2: contract.areaM2, monthlyRent, startDate: contract.startDate, endDate: contract.endDate },
    req.auth!.name,
  )
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'contract.create', target: contract.id })
  res.status(201).json(contract)
})

const signSchema = z.object({ signerName: z.string().min(2).default('مدیر پارک') })

contractsRouter.post('/:id/sign', requirePermission('contracts:sign:park'), (req, res) => {
  const parsed = signSchema.safeParse(req.body ?? {})
  const contract = getContract(req.params.id)
  if (!contract) {
    res.status(404).json({ error: 'قرارداد یافت نشد' })
    return
  }
  if (contract.signatures.some((s) => s.party === 'park')) {
    res.status(409).json({ error: 'این قرارداد قبلاً توسط پارک امضا شده است' })
    return
  }
  const signerName = parsed.success ? parsed.data.signerName : 'مدیر پارک'
  const signedAt = new Date().toISOString()
  contract.signatures.push({
    party: 'park',
    signerName,
    signedAt,
    hash: sha256(`${contract.id}|park|${signerName}|${signedAt}`),
  })
  appendContractEvent(contract.id, 'signed', { party: 'park', signerName }, signerName)
  if (contract.signatures.some((s) => s.party === 'tenant') && contract.state === 'pending_signatures') {
    contract.state = 'active'
    appendContractEvent(contract.id, 'activated', { note: 'هر دو طرف امضا کردند' }, 'سیستم')
  }
  saveContract(contract)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'contract.sign.park', target: contract.id })
  res.json({ ok: true, contract })
})

function monthsOverdueFor(companyId: string): number {
  const invoices = listEntities<RentalInvoice>('rentalInvoices', companyId)
  return invoices.filter((i) => i.status === 'Overdue').reduce((m, i) => Math.max(m, i.monthsOverdue), 0)
}

// اجرای خودکار شرط‌های یک قرارداد
contractsRouter.post('/:id/run-conditions', requirePermission('contracts:run-conditions'), (req, res) => {
  const contract = getContract(req.params.id)
  if (!contract) {
    res.status(404).json({ error: 'قرارداد یافت نشد' })
    return
  }
  const result = runContractConditions(contract, {
    asOf: Date.now(),
    monthsOverdue: monthsOverdueFor(contract.companyId),
    actor: req.auth!.name,
  })
  audit({
    userId: req.auth!.userId,
    role: req.auth!.role,
    action: 'contract.run-conditions',
    target: contract.id,
    meta: { events: result.events.length },
  })
  res.json({ contract: result.contract, appliedEvents: result.events })
})

// اجرای خودکار شرط‌های همه قراردادهای فعال
contractsRouter.post('/run-conditions/all', requirePermission('contracts:run-conditions'), (req, res) => {
  const contracts = listEntities<Contract>('contracts').filter((c) => c.state === 'active')
  let totalEvents = 0
  const touched: string[] = []
  for (const c of contracts) {
    const r = runContractConditions(c, {
      asOf: Date.now(),
      monthsOverdue: monthsOverdueFor(c.companyId),
      actor: req.auth!.name,
    })
    if (r.events.length) {
      totalEvents += r.events.length
      touched.push(c.id)
    }
  }
  audit({
    userId: req.auth!.userId,
    role: req.auth!.role,
    action: 'contract.run-conditions.all',
    meta: { touched: touched.length, events: totalEvents },
  })
  res.json({ processed: contracts.length, touched, appliedEvents: totalEvents })
})

const terminateSchema = z.object({ reason: z.string().min(3) })

contractsRouter.post('/:id/terminate', requirePermission('contracts:terminate'), (req, res) => {
  const parsed = terminateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'دلیل فسخ الزامی است' })
    return
  }
  const contract = getContract(req.params.id)
  if (!contract) {
    res.status(404).json({ error: 'قرارداد یافت نشد' })
    return
  }
  contract.state = 'terminated'
  appendContractEvent(contract.id, 'terminated', { reason: parsed.data.reason }, req.auth!.name)
  saveContract(contract)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'contract.terminate', target: contract.id })
  res.json({ ok: true, contract })
})
