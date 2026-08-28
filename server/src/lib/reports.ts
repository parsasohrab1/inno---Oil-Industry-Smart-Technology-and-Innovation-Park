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
  Paid: 'پرداخت‌شده',
  Overdue: 'معوق',
  Pending: 'در انتظار',
}

export const REPORTS: Record<string, ReportDef> = {
  'rent-collection': {
    id: 'rent-collection',
    title: 'گزارش وصول اجاره‌بها',
    scope: 'own',
    columns: [
      { header: 'شرکت', key: 'company', width: 34 },
      { header: 'دوره', key: 'period', width: 12 },
      { header: 'مبلغ اجاره (ریال)', key: 'rent', width: 20 },
      { header: 'جریمه (ریال)', key: 'penalty', width: 16 },
      { header: 'سررسید', key: 'due', width: 16 },
      { header: 'تاریخ پرداخت', key: 'paid', width: 16 },
      { header: 'وضعیت', key: 'status', width: 14 },
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
    title: 'گزارش شرکت‌های بدهکار',
    scope: 'all',
    columns: [
      { header: 'شرکت', key: 'company', width: 34 },
      { header: 'ماه معوقه', key: 'months', width: 12 },
      { header: 'مجموع بدهی (ریال)', key: 'amount', width: 22 },
      { header: 'دسترسی گیت', key: 'gate', width: 18 },
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
        .map((r) => ({ ...r, gate: r.gate ? 'مسدود' : 'فعال' }))
    },
  },
  'startup-valuations': {
    id: 'startup-valuations',
    title: 'گزارش ارزش‌گذاری استارت‌آپ‌ها',
    scope: 'all',
    columns: [
      { header: 'تیم', key: 'team', width: 28 },
      { header: 'ایده', key: 'idea', width: 40 },
      { header: 'امتیاز تیم', key: 'team_s', width: 12 },
      { header: 'امتیاز محصول', key: 'prod_s', width: 12 },
      { header: 'امتیاز بازار', key: 'mkt_s', width: 12 },
      { header: 'امتیاز نهایی', key: 'final', width: 12 },
      { header: 'ارزش‌گذاری (ریال)', key: 'val', width: 22 },
      { header: 'سرمایه پیشنهادی (ریال)', key: 'sug', width: 22 },
      { header: 'توصیه سرمایه‌گذاری', key: 'rec', width: 16 },
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
          rec: s.investmentRecommendation ? 'بله' : 'خیر',
        })),
  },
  funding: {
    id: 'funding',
    title: 'گزارش درخواست‌های تأمین مالی',
    scope: 'own',
    columns: [
      { header: 'شرکت', key: 'company', width: 34 },
      { header: 'صندوق', key: 'fund', width: 34 },
      { header: 'مبلغ درخواستی (ریال)', key: 'amount', width: 22 },
      { header: 'مرحله', key: 'stage', width: 16 },
      { header: 'احتمال موفقیت', key: 'prob', width: 14 },
      { header: 'تاریخ ثبت', key: 'date', width: 16 },
    ],
    rows: ({ companyId }) =>
      listEntities<FundingRequest>('fundingRequests', companyId).map((f) => ({
        company: f.companyName,
        fund: f.fund,
        amount: f.amountRequestedRial,
        stage: f.stage,
        prob: `${f.successProbability}٪`,
        date: faDate(f.submittedDate),
      })),
  },
  contracts: {
    id: 'contracts',
    title: 'گزارش قراردادها',
    scope: 'all',
    columns: [
      { header: 'شناسه', key: 'id', width: 22 },
      { header: 'شرکت', key: 'company', width: 34 },
      { header: 'متراژ', key: 'area', width: 10 },
      { header: 'اجاره ماهانه (ریال)', key: 'rent', width: 20 },
      { header: 'شروع', key: 'start', width: 16 },
      { header: 'پایان', key: 'end', width: 16 },
      { header: 'تمدید خودکار', key: 'renew', width: 12 },
      { header: 'وضعیت', key: 'state', width: 16 },
    ],
    rows: () =>
      listEntities<Contract>('contracts').map((c) => ({
        id: c.id,
        company: c.companyName,
        area: c.areaM2,
        rent: c.monthlyRent,
        start: faDate(c.startDate),
        end: faDate(c.endDate),
        renew: c.autoRenew ? 'بله' : 'خیر',
        state: c.state,
      })),
  },
  'park-summary': {
    id: 'park-summary',
    title: 'خلاصه وضعیت پارک',
    scope: 'all',
    columns: [
      { header: 'شاخص', key: 'metric', width: 40 },
      { header: 'مقدار', key: 'value', width: 30 },
    ],
    rows: () => {
      const d = assembleDataset()
      const billed = d.rentalInvoices.reduce((s, r) => s + r.totalRent, 0)
      const collected = d.rentalInvoices
        .filter((r) => r.status === 'Paid')
        .reduce((s, r) => s + r.totalRent, 0)
      return [
        { metric: 'تعداد شرکت‌های مستقر', value: d.companies.length },
        {
          metric: 'شرکت‌های دانش‌بنیان',
          value: d.companies.filter((c) => c.isKnowledgeBased).length,
        },
        { metric: 'مجموع نیروی انسانی', value: d.companies.reduce((s, c) => s + c.employeeCount, 0) },
        { metric: 'کل صورتحساب اجاره (ریال)', value: billed },
        { metric: 'وصول‌شده (ریال)', value: collected },
        { metric: 'نرخ وصول', value: `${((collected / billed) * 100).toFixed(1)}٪` },
        {
          metric: 'استارت‌آپ‌های توصیه‌شده به سرمایه‌گذاری',
          value: d.startups.filter((s) => s.investmentRecommendation).length,
        },
        {
          metric: 'تأمین مالی مصوب (ریال)',
          value: d.fundingRequests
            .filter((f) => f.stage === 'مصوب')
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
  const head = def.columns.map((c) => esc(c.header)).join(',')
  const body = rows.map((r) => def.columns.map((c) => esc(r[c.key])).join(',')).join('\n')
  return `﻿${head}\n${body}\n`
}

export async function toXlsx(def: ReportDef, rows: Array<Record<string, unknown>>): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'سامانه پارک هوشمند نفت (OIPMS)'
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
<div class="toolbar"><button onclick="window.print()">چاپ / ذخیره PDF</button></div>
<h1>${def.title}</h1>
<div class="sub">سامانه مدیریت یکپارچه پارک هوشمند نفت (OIPMS) — تولید: ${now} — ${rows.length} ردیف</div>
<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>
</body></html>`
}
