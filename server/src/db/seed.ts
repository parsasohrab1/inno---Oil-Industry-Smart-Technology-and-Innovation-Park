import { randomUUID } from 'node:crypto'
import 'dotenv/config'
import { db, migrate, putEntities, putEntity, setMeta, getMeta } from './index.ts'
import { generateDataset } from '../lib/synth.ts'
import { hashPassword } from '../lib/auth.ts'
import { appendContractEvent } from '../lib/contracts.ts'
import type { Contract, Role } from '../types.ts'

const RESET = process.argv.includes('--reset')

async function ensureUser(
  email: string,
  password: string,
  name: string,
  role: Role,
  companyId: string | null,
): Promise<void> {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (exists) return
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(randomUUID(), email, await hashPassword(password), name, role, companyId, new Date().toISOString())
}

export async function seed(): Promise<void> {
  migrate()

  if (RESET) {
    for (const t of ['entities', 'contract_events', 'audit_log', 'meta']) db.exec(`DELETE FROM ${t}`)
    db.exec("DELETE FROM users WHERE email LIKE '%@naftpark.ir'")
    console.log('🗑️  Previous data was cleared')
  }

  const already = getMeta('generatedAt')
  if (already && !RESET) {
    console.log('ℹ️  The dataset already exists. Use --reset to regenerate.')
    return
  }

  const d = generateDataset()

  putEntities(
    'companies',
    d.companies.map((c) => ({ id: c.id, companyId: c.id, data: c })),
  )
  putEntities(
    'rentalInvoices',
    d.rentalInvoices.map((r) => ({ id: r.id, companyId: r.tenantId, data: r })),
  )
  putEntities(
    'bookings',
    d.bookings.map((b) => ({ id: b.id, companyId: b.companyId, data: b })),
  )
  // we assign a few mentoring paths to the demo mentor so the mentor dashboard has data
  const DEMO_MENTOR = 'Demo mentor'
  d.mentoring.forEach((m, i) => {
    if (i % 17 === 0) m.mentorName = DEMO_MENTOR
  })
  putEntities(
    'mentoring',
    d.mentoring.map((m) => ({ id: m.id, companyId: m.companyId, data: m })),
  )
  putEntities(
    'fundingRequests',
    d.fundingRequests.map((f) => ({ id: f.id, companyId: f.companyId, data: f })),
  )
  putEntities(
    'startups',
    d.startups.map((s) => ({ id: s.id, companyId: null, data: s })),
  )
  putEntities(
    'events',
    d.events.map((e) => ({ id: e.id, companyId: null, data: e })),
  )
  putEntities(
    'domesticOpportunities',
    d.domesticOpportunities.map((o) => ({ id: o.id, companyId: null, data: o })),
  )
  putEntities(
    'markets',
    d.markets.map((m) => ({ id: m.country, companyId: null, data: m })),
  )
  putEntities(
    'notifications',
    d.notifications.map((n) => ({ id: n.id, companyId: null, data: n })),
  )
  putEntities(
    'balanceSheets',
    d.balanceSheets.map((b) => ({ id: `${b.companyId}-${b.period}`, companyId: b.companyId, data: b })),
  )
  putEntities(
    'attendance',
    d.attendance.map((a, i) => ({ id: `${a.userId}-${a.date}-${i}`, companyId: a.companyId, data: a })),
  )
  putEntities(
    'vehicles',
    d.vehicles.map((v, i) => ({ id: `${v.equipmentId}-${i}`, companyId: v.companyOrigin, data: v })),
  )

  // ===== Lease contracts for each company =====
  const contractRows: Contract[] = []
  for (const c of d.companies) {
    const start = new Date(d.generatedAt)
    start.setUTCMonth(start.getUTCMonth() - 8)
    const end = new Date(start)
    end.setUTCFullYear(end.getUTCFullYear() + 1)
    const monthlyRent = Math.round(c.areaM2 * c.rentalRatePerM2)
    const idx = d.companies.indexOf(c)
    const state: Contract['state'] = idx % 9 === 0 ? 'pending_signatures' : idx % 13 === 0 ? 'draft' : 'active'
    const contract: Contract = {
      id: `CT-${c.id}`,
      companyId: c.id,
      companyName: c.name,
      title: `Oil Technology Park space lease contract — ${c.name}`,
      areaM2: c.areaM2,
      ratePerM2: c.rentalRatePerM2,
      monthlyRent,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      autoRenew: idx % 3 !== 0,
      penaltyRatePerMonth: 0.02,
      state,
      signatures:
        state === 'active'
          ? [
              { party: 'park', signerName: 'Park manager', signedAt: start.toISOString(), hash: '' },
              { party: 'tenant', signerName: c.name, signedAt: start.toISOString(), hash: '' },
            ]
          : state === 'pending_signatures'
            ? [{ party: 'park', signerName: 'Park manager', signedAt: start.toISOString(), hash: '' }]
            : [],
      createdAt: start.toISOString(),
      updatedAt: start.toISOString(),
    }
    contractRows.push(contract)
    putEntity('contracts', contract.id, contract.companyId, contract)
    appendContractEvent(
      contract.id,
      'created',
      { areaM2: contract.areaM2, monthlyRent, startDate: contract.startDate, endDate: contract.endDate },
      'System (initial load)',
    )
    for (const sig of contract.signatures) {
      appendContractEvent(contract.id, 'signed', { party: sig.party, signerName: sig.signerName }, sig.signerName)
    }
    if (state === 'active') {
      appendContractEvent(contract.id, 'activated', { note: 'Both parties signed' }, 'System')
    }
  }

  setMeta('generatedAt', d.generatedAt)
  setMeta('seededAt', new Date().toISOString())

  // ===== Sample users =====
  const c0 = d.companies[0]!
  const c1 = d.companies[1]!
  await ensureUser('admin@naftpark.ir', 'admin1234', 'Park manager', 'admin', null)
  await ensureUser('operator@naftpark.ir', 'operator1234', 'Park operator', 'operator', null)
  await ensureUser('company@naftpark.ir', 'company1234', `Manager of ${c0.name}`, 'company', c0.id)
  await ensureUser('startup@naftpark.ir', 'startup1234', `Founder of ${c1.name}`, 'startup', c1.id)
  await ensureUser('investor@naftpark.ir', 'investor1234', 'Demo investor', 'investor', null)
  await ensureUser('mentor@naftpark.ir', 'mentor1234', 'Demo mentor', 'mentor', null)

  console.log(`✅ ${d.companies.length} companies, ${contractRows.length} contracts, ${d.rentalInvoices.length} invoices and 6 sample users were recorded`)
}

if (import.meta.url === `file://${process.argv[1]}` || import.meta.filename === process.argv[1]) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
