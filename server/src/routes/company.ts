import { Router } from 'express'
import { z } from 'zod'
import { audit, getEntity, listEntities, putEntity } from '../db/index.ts'
import { requireAuth, requireOwnCompany, requirePermission } from '../middleware/auth.ts'
import { appendContractEvent, getContract, saveContract, sha256 } from '../lib/contracts.ts'
import type {
  Company,
  FundingRequest,
  MeetingBooking,
  MentoringEngagement,
  RentalInvoice,
} from '../types.ts'

export const companyRouter: ReturnType<typeof Router> = Router()

companyRouter.use(requireAuth, requireOwnCompany)

const cid = (req: { auth?: { companyId: string | null } }) => req.auth!.companyId!

companyRouter.get('/me', (req, res) => {
  const company = getEntity<Company>('companies', cid(req))
  if (!company) {
    res.status(404).json({ error: 'شرکت یافت نشد' })
    return
  }
  res.json(company)
})

// ===== صورتحساب‌ها =====
companyRouter.get('/invoices', requirePermission('invoices:read:own'), (req, res) => {
  res.json(listEntities<RentalInvoice>('rentalInvoices', cid(req)))
})

companyRouter.post('/invoices/:id/pay', requirePermission('invoices:pay:own'), (req, res) => {
  const inv = getEntity<RentalInvoice>('rentalInvoices', req.params.id)
  if (!inv || inv.tenantId !== cid(req)) {
    res.status(404).json({ error: 'صورتحساب یافت نشد' })
    return
  }
  if (inv.status === 'Paid') {
    res.status(409).json({ error: 'این صورتحساب قبلاً پرداخت شده است' })
    return
  }
  inv.status = 'Paid'
  inv.paymentDate = new Date().toISOString().slice(0, 10)
  inv.monthsOverdue = 0
  inv.gateAccessRevoked = false
  putEntity('rentalInvoices', inv.id, inv.tenantId, inv)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'invoice.pay', target: inv.id })
  res.json({ ok: true, invoice: inv })
})

// ===== قراردادها =====
companyRouter.get('/contracts', requirePermission('contracts:read:own'), (req, res) => {
  res.json(listEntities('contracts', cid(req)))
})

const signSchema = z.object({ signerName: z.string().min(2) })

companyRouter.post('/contracts/:id/sign', requirePermission('contracts:sign:tenant'), (req, res) => {
  const parsed = signSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'نام امضاکننده الزامی است' })
    return
  }
  const contract = getContract(req.params.id)
  if (!contract || contract.companyId !== cid(req)) {
    res.status(404).json({ error: 'قرارداد یافت نشد' })
    return
  }
  if (contract.signatures.some((s) => s.party === 'tenant')) {
    res.status(409).json({ error: 'این قرارداد قبلاً توسط شرکت امضا شده است' })
    return
  }
  const signedAt = new Date().toISOString()
  const hash = sha256(`${contract.id}|tenant|${parsed.data.signerName}|${signedAt}`)
  contract.signatures.push({ party: 'tenant', signerName: parsed.data.signerName, signedAt, hash })
  appendContractEvent(
    contract.id,
    'signed',
    { party: 'tenant', signerName: parsed.data.signerName },
    parsed.data.signerName,
  )
  const bothSigned = contract.signatures.some((s) => s.party === 'park')
  if (bothSigned && contract.state === 'pending_signatures') {
    contract.state = 'active'
    appendContractEvent(contract.id, 'activated', { note: 'هر دو طرف امضا کردند' }, 'سیستم')
  }
  saveContract(contract)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'contract.sign.tenant', target: contract.id })
  res.json({ ok: true, contract })
})

// ===== درخواست تأمین مالی =====
companyRouter.get('/funding', requirePermission('funding:read:own'), (req, res) => {
  res.json(listEntities<FundingRequest>('fundingRequests', cid(req)))
})

const fundingSchema = z.object({
  fund: z.string().min(2),
  amountRequestedRial: z.number().positive(),
})

companyRouter.post('/funding', requirePermission('funding:apply:own'), (req, res) => {
  const parsed = fundingSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'اطلاعات درخواست نامعتبر است' })
    return
  }
  const company = getEntity<Company>('companies', cid(req))
  const id = `FR-${Date.now()}`
  const fr: FundingRequest = {
    id,
    companyId: cid(req),
    companyName: company?.name ?? '—',
    fund: parsed.data.fund,
    amountRequestedRial: parsed.data.amountRequestedRial,
    stage: 'ثبت درخواست',
    submittedDate: new Date().toISOString().slice(0, 10),
    successProbability: 40,
  }
  putEntity('fundingRequests', id, fr.companyId, fr)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'funding.apply', target: id })
  res.status(201).json(fr)
})

// ===== رزرو اتاق جلسات =====
companyRouter.get('/bookings', requirePermission('bookings:read:own'), (req, res) => {
  res.json(listEntities<MeetingBooking>('bookings', cid(req)))
})

const bookingSchema = z.object({
  roomName: z.string().min(1),
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480),
  participantCount: z.number().int().min(1).max(200),
  isVirtual: z.boolean().optional(),
})

companyRouter.post('/bookings', requirePermission('bookings:create:own'), (req, res) => {
  const parsed = bookingSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'اطلاعات رزرو نامعتبر است', details: parsed.error.flatten() })
    return
  }
  const start = new Date(parsed.data.startTime)
  const end = new Date(start.getTime() + parsed.data.durationMinutes * 60000)

  // بررسی تداخل با رزروهای تأییدشده همان اتاق
  const clash = listEntities<MeetingBooking>('bookings').some(
    (b) =>
      b.roomName === parsed.data.roomName &&
      b.status === 'Confirmed' &&
      start < new Date(b.endTime) &&
      end > new Date(b.startTime),
  )
  if (clash) {
    res.status(409).json({ error: 'این اتاق در بازه انتخابی قبلاً رزرو شده است' })
    return
  }

  const company = getEntity<Company>('companies', cid(req))
  const id = `B-${Date.now()}`
  const booking: MeetingBooking = {
    id,
    companyId: cid(req),
    companyName: company?.name ?? '—',
    roomName: parsed.data.roomName,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMinutes: parsed.data.durationMinutes,
    participantCount: parsed.data.participantCount,
    status: 'Confirmed',
    isVirtual: parsed.data.isVirtual ?? false,
  }
  putEntity('bookings', id, booking.companyId, booking)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'booking.create', target: id })
  res.status(201).json(booking)
})

companyRouter.post('/bookings/:id/cancel', requirePermission('bookings:cancel:own'), (req, res) => {
  const b = getEntity<MeetingBooking>('bookings', req.params.id)
  if (!b || b.companyId !== cid(req)) {
    res.status(404).json({ error: 'رزرو یافت نشد' })
    return
  }
  b.status = 'Cancelled'
  putEntity('bookings', b.id, b.companyId, b)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'booking.cancel', target: b.id })
  res.json({ ok: true, booking: b })
})

// ===== منتورینگ من =====
companyRouter.get('/mentoring', requirePermission('mentoring:read:own'), (req, res) => {
  res.json(listEntities<MentoringEngagement>('mentoring', cid(req)))
})
