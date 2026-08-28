import { createHash, randomUUID } from 'node:crypto'
import { db, getEntity, putEntity } from '../db/index.ts'
import type { Contract, ContractEvent } from '../types.ts'

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function contractEvents(contractId: string): ContractEvent[] {
  return db
    .prepare('SELECT * FROM contract_events WHERE contract_id = ? ORDER BY seq ASC')
    .all(contractId)
    .map((r) => {
      const row = r as {
        id: string
        contract_id: string
        seq: number
        type: string
        payload: string
        actor: string
        created_at: string
        prev_hash: string
        hash: string
      }
      return {
        id: row.id,
        contractId: row.contract_id,
        seq: row.seq,
        type: row.type as ContractEvent['type'],
        payload: JSON.parse(row.payload) as Record<string, unknown>,
        actor: row.actor,
        createdAt: row.created_at,
        prevHash: row.prev_hash,
        hash: row.hash,
      }
    })
}

/** افزودن یک رویداد به زنجیره تغییرناپذیر قرارداد (هش‌چین) */
export function appendContractEvent(
  contractId: string,
  type: ContractEvent['type'],
  payload: Record<string, unknown>,
  actor: string,
): ContractEvent {
  const prev = db
    .prepare('SELECT seq, hash FROM contract_events WHERE contract_id = ? ORDER BY seq DESC LIMIT 1')
    .get(contractId) as { seq: number; hash: string } | undefined
  const seq = (prev?.seq ?? 0) + 1
  const prevHash = prev?.hash ?? 'GENESIS'
  const createdAt = new Date().toISOString()
  const id = randomUUID()
  const hash = sha256(
    JSON.stringify({ contractId, seq, type, payload, actor, createdAt, prevHash }),
  )
  db.prepare(
    `INSERT INTO contract_events (id, contract_id, seq, type, payload, actor, created_at, prev_hash, hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, contractId, seq, type, JSON.stringify(payload), actor, createdAt, prevHash, hash)
  return { id, contractId, seq, type, payload, actor, createdAt, prevHash, hash }
}

/** بررسی سلامت زنجیره هش قرارداد */
export function verifyContractChain(contractId: string): { valid: boolean; brokenAtSeq?: number } {
  const events = contractEvents(contractId)
  let prevHash = 'GENESIS'
  for (const e of events) {
    const expected = sha256(
      JSON.stringify({
        contractId,
        seq: e.seq,
        type: e.type,
        payload: e.payload,
        actor: e.actor,
        createdAt: e.createdAt,
        prevHash,
      }),
    )
    if (e.prevHash !== prevHash || e.hash !== expected) return { valid: false, brokenAtSeq: e.seq }
    prevHash = e.hash
  }
  return { valid: true }
}

export function getContract(id: string): Contract | null {
  return getEntity<Contract>('contracts', id)
}

export function saveContract(c: Contract): void {
  c.updatedAt = new Date().toISOString()
  putEntity('contracts', c.id, c.companyId, c)
}

/**
 * اجرای خودکار شرط‌های قرارداد در تاریخ مشخص.
 * - سررسید گذشته + تمدید خودکار → تمدید ۱۲ ماهه
 * - سررسید گذشته + بدون تمدید → انقضا
 * - بدهی معوق ≥ ۲ ماه → اعمال جریمه و تغییر دسترسی گیت
 */
export function runContractConditions(
  contract: Contract,
  ctx: { asOf: number; monthsOverdue: number; actor: string },
): { contract: Contract; events: ContractEvent[] } {
  const events: ContractEvent[] = []
  if (contract.state !== 'active') return { contract, events }

  const end = Date.parse(contract.endDate)

  if (ctx.monthsOverdue >= 2) {
    const penalty = Math.round(contract.monthlyRent * contract.penaltyRatePerMonth * ctx.monthsOverdue)
    events.push(
      appendContractEvent(
        contract.id,
        'penalty_applied',
        { monthsOverdue: ctx.monthsOverdue, penalty, rule: 'overdue>=2 → penalty' },
        ctx.actor,
      ),
    )
    events.push(
      appendContractEvent(
        contract.id,
        'gate_access_changed',
        { gateAccess: 'revoked', reason: 'بدهی معوق ۲ ماه یا بیشتر' },
        ctx.actor,
      ),
    )
  }

  if (ctx.asOf >= end) {
    if (contract.autoRenew) {
      const newEnd = new Date(end + 365 * 86400000).toISOString().slice(0, 10)
      contract.startDate = contract.endDate
      contract.endDate = newEnd
      events.push(
        appendContractEvent(
          contract.id,
          'renewed',
          { newEndDate: newEnd, rule: 'endDate passed + autoRenew' },
          ctx.actor,
        ),
      )
    } else {
      contract.state = 'expired'
      events.push(
        appendContractEvent(contract.id, 'expired', { rule: 'endDate passed + no autoRenew' }, ctx.actor),
      )
    }
  }

  if (events.length) saveContract(contract)
  return { contract, events }
}
