import type { Dataset } from '@/lib/types'

export interface KpiTrend {
  value: number
  delta: number // درصد تغییر نسبت به دوره قبل
}

export interface OverviewKpis {
  companies: number
  knowledgeBasedShare: number
  occupancyM2: number
  totalWorkforce: number
  operators: number
  monthlyRentBillun: number
  collectionRate: number
  overdueCompanies: number
  activeMentoring: number
  upcomingEvents: number
  approvedFundingRial: number
  startupsRecommended: number
  criticalAlerts: number
}

export function overviewKpis(d: Dataset): OverviewKpis {
  const now = Date.parse(d.generatedAt)
  const totalRent = d.rentalInvoices.reduce((s, r) => s + r.totalRent, 0)
  const paidRent = d.rentalInvoices
    .filter((r) => r.status === 'Paid')
    .reduce((s, r) => s + r.totalRent, 0)
  const overdueCompanies = new Set(
    d.rentalInvoices.filter((r) => r.status === 'Overdue').map((r) => r.tenantId),
  ).size
  const monthsSpan = new Set(d.rentalInvoices.map((r) => r.period)).size || 1

  return {
    companies: d.companies.length,
    knowledgeBasedShare:
      (d.companies.filter((c) => c.isKnowledgeBased).length / d.companies.length) * 100,
    occupancyM2: d.companies.reduce((s, c) => s + c.areaM2, 0),
    totalWorkforce: d.companies.reduce((s, c) => s + c.employeeCount, 0),
    operators: 3,
    monthlyRentBillun: totalRent / monthsSpan / 1e9,
    collectionRate: (paidRent / totalRent) * 100,
    overdueCompanies,
    activeMentoring: d.mentoring.filter((m) => m.status === 'در حال انجام').length,
    upcomingEvents: d.events.filter(
      (e) => e.status === 'برنامه‌ریزی‌شده' && Date.parse(e.startDate) > now,
    ).length,
    approvedFundingRial: d.fundingRequests
      .filter((f) => f.stage === 'مصوب')
      .reduce((s, f) => s + f.amountRequestedRial, 0),
    startupsRecommended: d.startups.filter((s) => s.investmentRecommendation).length,
    criticalAlerts: d.notifications.filter((n) => n.severity === 'critical' && !n.read).length,
  }
}

export function rentByPeriod(d: Dataset) {
  const map = new Map<string, { period: string; billed: number; collected: number; overdue: number }>()
  for (const r of d.rentalInvoices) {
    const row = map.get(r.period) ?? { period: r.period, billed: 0, collected: 0, overdue: 0 }
    row.billed += r.totalRent
    if (r.status === 'Paid') row.collected += r.totalRent
    if (r.status === 'Overdue') row.overdue += r.totalRent + r.penalty
    map.set(r.period, row)
  }
  return [...map.values()].sort((a, b) => cmpPeriod(a.period, b.period))
}

function cmpPeriod(a: string, b: string) {
  const [ay, am] = a.split('/').map(Number)
  const [by, bm] = b.split('/').map(Number)
  return ay - by || am - bm
}

export function companiesByField(d: Dataset) {
  const map = new Map<string, number>()
  for (const c of d.companies) map.set(c.field, (map.get(c.field) ?? 0) + 1)
  return [...map.entries()].map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count)
}

export function debtors(d: Dataset) {
  const map = new Map<
    string,
    { companyId: string; companyName: string; amount: number; months: number; gateRevoked: boolean }
  >()
  for (const r of d.rentalInvoices) {
    if (r.status !== 'Overdue') continue
    const row =
      map.get(r.tenantId) ??
      { companyId: r.tenantId, companyName: r.companyName, amount: 0, months: 0, gateRevoked: false }
    row.amount += r.totalRent + r.penalty
    row.months = Math.max(row.months, r.monthsOverdue)
    row.gateRevoked = row.gateRevoked || r.gateAccessRevoked
    map.set(r.tenantId, row)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

export function fundingFunnel(d: Dataset) {
  const order = ['ثبت درخواست', 'بررسی اولیه', 'ارزیابی فنی', 'مذاکره', 'مصوب', 'رد شده'] as const
  return order.map((stage) => {
    const rows = d.fundingRequests.filter((f) => f.stage === stage)
    return {
      stage,
      count: rows.length,
      amount: rows.reduce((s, f) => s + f.amountRequestedRial, 0),
    }
  })
}

export function mentoringByArea(d: Dataset) {
  const map = new Map<
    string,
    { area: string; total: number; active: number; completed: number; avgProgress: number }
  >()
  for (const m of d.mentoring) {
    const row =
      map.get(m.area) ?? { area: m.area, total: 0, active: 0, completed: 0, avgProgress: 0 }
    row.total += 1
    if (m.status === 'در حال انجام') row.active += 1
    if (m.status === 'تکمیل‌شده') row.completed += 1
    row.avgProgress += m.progressPercent
    map.set(m.area, row)
  }
  return [...map.values()].map((r) => ({ ...r, avgProgress: r.avgProgress / r.total }))
}

export function attendanceTrend(d: Dataset) {
  const map = new Map<string, number>()
  for (const a of d.attendance) map.set(a.date, (map.get(a.date) ?? 0) + 1)
  return [...map.entries()]
    .map(([date, present]) => ({ date, present }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function roomUtilization(d: Dataset) {
  const map = new Map<string, { room: string; bookings: number; minutes: number }>()
  for (const b of d.bookings) {
    if (b.status === 'Cancelled') continue
    const row = map.get(b.roomName) ?? { room: b.roomName, bookings: 0, minutes: 0 }
    row.bookings += 1
    row.minutes += b.durationMinutes
    map.set(b.roomName, row)
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes)
}

export function topValuations(d: Dataset, n = 10) {
  return [...d.startups].sort((a, b) => b.valuationRial - a.valuationRial).slice(0, n)
}

export function companyProfit(d: Dataset) {
  const map = new Map<string, { companyId: string; companyName: string; revenue: number; profit: number }>()
  for (const b of d.balanceSheets) {
    const row =
      map.get(b.companyId) ?? { companyId: b.companyId, companyName: b.companyName, revenue: 0, profit: 0 }
    row.revenue += b.revenue
    row.profit += b.netProfit
    map.set(b.companyId, row)
  }
  return [...map.values()]
}
