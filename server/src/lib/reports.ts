import ExcelJS from 'exceljs'
import { listEntities } from '../db/index.ts'
import { assembleDataset } from './dataset.ts'
import type { Contract, FundingRequest, RentalInvoice, StartupEvaluation } from '../types.ts'

export interface ReportColumn {
  header: string
  key: string
  width?: number
}

export interface ReportDef {
  id: string
  title: string
  columns: ReportColumn[]
  rows: (opts: { companyId?: string }) => Array<Record<string, unknown>>
  scope: 'all' | 'own'
}

const faDate = (s: string | null) =>
  s ? new Intl.DateTimeFormat('fa-IR-u-ca-persian').format(new Date(s)) : '—'

const STATUS_FA: Record<string, string> = {
  Paid: 'Paid',
  Overdue: 'Overdue',
  Pending: 'Pending',
}

export const REPORTS: Record<string, ReportDef> = {
  'rent-collection': {
    id: 'rent-collection',
    title: 'Rent Collection Report',
    scope: 'own',
    columns: [
      { header: 'Company', key: 'company', width: 34 },
      { header: 'Period', key: 'period', width: 12 },
      { header: 'Rent amount (rials)', key: 'rent', width: 20 },
      { header: 'Penalty (rials)', key: 'penalty', width: 16 },
      { header: 'Due date', key: 'due', width: 16 },
      { header: 'Payment date', key: 'paid', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ],
    rows: ({ companyId }) =>
      listEntities<RentalInvoice>('rentalInvoices', companyId).map((r) => ({
        company: r.companyName,
        period: r.period,
        rent: r.totalRent,
        penalty: r.penalty,
        due: faDate(r.dueDate),
        paid: faDate(r.paymentDate),
        status: STATUS_FA[r.status] ?? r.status,
      })),
  },
  debtors: {
    id: 'debtors',
    title: 'Companies in Arrears Report',
    scope: 'all',
    columns: [
      { header: 'Company', key: 'company', width: 34 },
      { header: 'Overdue months', key: 'months', width: 12 },
      { header: 'Total debt (rials)', key: 'amount', width: 22 },
      { header: 'Gate access', key: 'gate', width: 18 },
    ],
    rows: () => {
      const map = new Map<string, { company: string; months: number; amount: number; gate: boolean }>()
      for (const r of listEntities<RentalInvoice>('rentalInvoices')) {
        if (r.status !== 'Overdue') continue
        const row = map.get(r.tenantId) ?? { company: r.companyName, months: 0, amount: 0, gate: false }
        row.months = Math.max(row.months, r.monthsOverdue)
        row.amount += r.totalRent + r.penalty
        row.gate = row.gate || r.gateAccessRevoked
        map.set(r.tenantId, row)
      }
      return [...map.values()]
        .sort((a, b) => b.amount - a.amount)
        .map((r) => ({ ...r, gate: r.gate ? 'Blocked' : 'Active' }))
    },
  },
  'startup-valuations': {
    id: 'startup-valuations',
    title: 'Startup Valuation Report',
    scope: 'all',
    columns: [
      { header: 'Team', key: 'team', width: 28 },
      { header: 'Idea', key: 'idea', width: 40 },
      { header: 'Team score', key: 'team_s', width: 12 },
      { header: 'Product score', key: 'prod_s', width: 12 },
      { header: 'Market score', key: 'mkt_s', width: 12 },
      { header: 'Final score', key: 'final', width: 12 },
      { header: 'Valuation (rials)', key: 'val', width: 22 },
      { header: 'Suggested investment (rials)', key: 'sug', width: 22 },
      { header: 'Investment recommendation', key: 'rec', width: 16 },
    ],
    rows: () =>
      listEntities<StartupEvaluation>('startups')
        .sort((a, b) => b.valuationRial - a.valuationRial)
        .map((s) => ({
          team: s.teamName,
          idea: s.ideaTitle,
          team_s: s.teamScore,
          prod_s: s.productScore,
          mkt_s: s.marketScore,
          final: s.aiFinalScore,
          val: s.valuationRial,
          sug: s.suggestedInvestmentRial,
          rec: s.investmentRecommendation ? 'Yes' : 'No',
        })),
  },
  funding: {
    id: 'funding',
    title: 'Financing Requests Report',
    scope: 'own',
    columns: [
      { header: 'Company', key: 'company', width: 34 },
      { header: 'Fund', key: 'fund', width: 34 },
      { header: 'Requested amount (rials)', key: 'amount', width: 22 },
      { header: 'Stage', key: 'stage', width: 16 },
      { header: 'Success probability', key: 'prob', width: 14 },
      { header: 'Registration date', key: 'date', width: 16 },
    ],
    rows: ({ companyId }) =>
      listEntities<FundingRequest>('fundingRequests', companyId).map((f) => ({
        company: f.companyName,
        fund: f.fund,
        amount: f.amountRequestedRial,
        stage: f.stage,
        prob: `${f.successProbability}%`,
        date: faDate(f.submittedDate),
      })),
  },
  contracts: {
    id: 'contracts',
    title: 'Contracts Report',
    scope: 'all',
    columns: [
      { header: 'ID', key: 'id', width: 22 },
      { header: 'Company', key: 'company', width: 34 },
      { header: 'Area', key: 'area', width: 10 },
      { header: 'Monthly rent (rials)', key: 'rent', width: 20 },
      { header: 'Start', key: 'start', width: 16 },
      { header: 'End', key: 'end', width: 16 },
      { header: 'Auto-renew', key: 'renew', width: 12 },
      { header: 'Status', key: 'state', width: 16 },
    ],
    rows: () =>
      listEntities<Contract>('contracts').map((c) => ({
        id: c.id,
        company: c.companyName,
        area: c.areaM2,
        rent: c.monthlyRent,
        start: faDate(c.startDate),
        end: faDate(c.endDate),
        renew: c.autoRenew ? 'Yes' : 'No',
        state: c.state,
      })),
  },
  'park-summary': {
    id: 'park-summary',
    title: 'Park Status Summary',
    scope: 'all',
    columns: [
      { header: 'Metric', key: 'metric', width: 40 },
      { header: 'Value', key: 'value', width: 30 },
    ],
    rows: () => {
      const d = assembleDataset()
      const billed = d.rentalInvoices.reduce((s, r) => s + r.totalRent, 0)
      const collected = d.rentalInvoices
        .filter((r) => r.status === 'Paid')
        .reduce((s, r) => s + r.totalRent, 0)
      return [
        { metric: 'Number of resident companies', value: d.companies.length },
        {
          metric: 'Knowledge-based companies',
          value: d.companies.filter((c) => c.isKnowledgeBased).length,
        },
        { metric: 'Total workforce', value: d.companies.reduce((s, c) => s + c.employeeCount, 0) },
        { metric: 'Total rent invoiced (rials)', value: billed },
        { metric: 'Collected (rials)', value: collected },
        { metric: 'Collection rate', value: `${((collected / billed) * 100).toFixed(1)}%` },
        {
          metric: 'Startups recommended for investment',
          value: d.startups.filter((s) => s.investmentRecommendation).length,
        },
        {
          metric: 'Approved financing (rials)',
          value: d.fundingRequests
            .filter((f) => f.stage === 'Approved')
            .reduce((s, f) => s + f.amountRequestedRial, 0),
        },
      ]
    },
  },
}

export function toCsv(def: ReportDef, rows: Array<Record<string, unknown>>): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const BOM = String.fromCharCode(0xfeff)
  const head = def.columns.map((c) => esc(c.header)).join(',')
  const body = rows.map((r) => def.columns.map((c) => esc(r[c.key])).join(',')).join('\n')
  return `${BOM}${head}\n${body}\n`
}

export async function toXlsx(def: ReportDef, rows: Array<Record<string, unknown>>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Oil Smart Park System (OIPMS)'
  wb.created = new Date()
  const ws = wb.addWorksheet(def.title, { views: [{ rightToLeft: true }] })
  ws.columns = def.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18 }))
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F9E66' } }
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.addRows(rows)
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

export function toPrintableHtml(def: ReportDef, rows: Array<Record<string, unknown>>): string {
  const now = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date())
  const th = def.columns.map((c) => `<th>${c.header}</th>`).join('')
  const trs = rows
    .map(
      (r) =>
        `<tr>${def.columns
          .map((c) => {
            const v = r[c.key]
            const cell =
              typeof v === 'number' ? new Intl.NumberFormat('fa-IR').format(v) : (v ?? '—')
            return `<td>${cell}</td>`
          })
          .join('')}</tr>`,
    )
    .join('')
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<title>${def.title}</title>
<style>
  body{font-family:Vazirmatn,Tahoma,sans-serif;margin:32px;color:#0f1e18}
  h1{font-size:20px;margin:0 0 4px}
  .sub{color:#64748b;font-size:12px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:right}
  thead th{background:#1f9e66;color:#fff}
  tbody tr:nth-child(even){background:#f1f5f9}
  .toolbar{margin-bottom:16px}
  button{padding:8px 16px;border:0;border-radius:8px;background:#1f9e66;color:#fff;cursor:pointer;font-family:inherit}
  @media print{.toolbar{display:none}}
</style></head><body>
<div class="toolbar"><button onclick="window.print()">Print / Save PDF</button></div>
<h1>${def.title}</h1>
<div class="sub">Oil Smart Park Integrated Management System (OIPMS) — generated: ${now} — ${rows.length} rows</div>
<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>
</body></html>`
}
