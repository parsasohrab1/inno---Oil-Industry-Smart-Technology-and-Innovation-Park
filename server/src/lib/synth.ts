import { Rng } from './rng.ts'
import { Faker } from './faker.ts'
import {
  COMPANY_FIELDS,
  MENTORING_AREAS,
  type AttendanceRecord,
  type BalanceSheet,
  type BookingStatus,
  type Company,
  type Dataset,
  type DomesticOpportunity,
  type EventStatus,
  type FundingRequest,
  type MarketRow,
  type MeetingBooking,
  type MentoringEngagement,
  type MentoringStatus,
  type Notification,
  type ParkEvent,
  type PatentStatus,
  type PaymentStatus,
  type RentalInvoice,
  type StartupEvaluation,
  type VehicleLog,
} from '../types.ts'

export interface GenConfig {
  seed: number
  companies: number
  attendanceEmployeesPerCompany: number
  attendanceDays: number
  vehicleRecords: number
  rentalMonths: number
  bookings: number
  startups: number
  events: number
  balancePeriods: number
  fundingRequests: number
  now: number
}

export const DEFAULT_CONFIG: GenConfig = {
  seed: 42,
  companies: 52,
  attendanceEmployeesPerCompany: 6,
  attendanceDays: 60,
  vehicleRecords: 1400,
  rentalMonths: 12,
  bookings: 1200,
  startups: 200,
  events: 100,
  balancePeriods: 4,
  fundingRequests: 60,
  now: Date.parse('2026-08-28T09:00:00Z'),
}

const ROOMS = [
  'فردوسی', 'سعدی', 'حافظ', 'مولوی', 'خیام', 'نظامی', 'عطار', 'سنایی',
  'جامی', 'رودکی', 'پروین', 'شهریار', 'صائب', 'بیدل', 'باباطاهر', 'اوحدی',
]
const GATES = ['G1', 'G2', 'G3']
const FUNDS = [
  'صندوق پژوهش و فناوری وزارت نفت',
  'صندوق نوآوری و شکوفایی',
  'صندوق توسعه ملی — بخش نفت',
  'صندوق خطرپذیر پارسیان',
  'سرمایه‌گذاران فرشته صنعت نفت',
  'صندوق سرمایه‌گذاری جسورانه دانش‌بنیان',
]

const iso = (d: Date) => d.toISOString()
const isoDate = (d: Date) => d.toISOString().slice(0, 10)

export function generateDataset(partial: Partial<GenConfig> = {}): Dataset {
  const cfg = { ...DEFAULT_CONFIG, ...partial }
  const rng = new Rng(cfg.seed)
  const faker = new Faker(rng)
  const { now } = cfg

  const companies: Company[] = Array.from({ length: cfg.companies }, (_, i) => ({
    id: `C${1000 + i}`,
    name: faker.company(),
    establishmentDate: isoDate(faker.dateBetween(-365 * 15, -365, now)),
    employeeCount: rng.int(5, 180),
    field: rng.pick(COMPANY_FIELDS),
    areaM2: rng.int(50, 2000),
    rentalRatePerM2: Math.round(rng.float(2_000_000, 8_000_000)),
    maturityLevel: rng.int(1, 5),
    isKnowledgeBased: rng.bool(0.42),
    hasPatent: rng.bool(0.3),
  }))

  const attendance: AttendanceRecord[] = []
  const startDay = now - cfg.attendanceDays * 86400000
  for (const c of companies) {
    const emps = Math.min(c.employeeCount, cfg.attendanceEmployeesPerCompany)
    for (let e = 0; e < emps; e++) {
      const userId = `${c.id}-U${e + 1}`
      for (let d = 0; d < cfg.attendanceDays; d++) {
        const date = new Date(startDay + d * 86400000)
        if (date.getUTCDay() === 5) continue
        if (!rng.bool(0.86)) continue
        attendance.push({
          userId,
          companyId: c.id,
          date: isoDate(date),
          checkIn: `${String(rng.int(7, 9)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}`,
          checkOut: `${String(rng.int(16, 19)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}`,
          gateId: rng.pick(GATES),
        })
      }
    }
  }

  const rentalInvoices: RentalInvoice[] = []
  const debtByCompany = new Map<string, number>()
  const rentStart = now - cfg.rentalMonths * 30 * 86400000
  for (const c of companies) {
    const payerTier = rng.weighted(['good', 'average', 'poor'] as const, [0.62, 0.26, 0.12])
    const overdueProb = payerTier === 'good' ? 0.015 : payerTier === 'average' ? 0.07 : 0.32
    const pendingProb = payerTier === 'good' ? 0.06 : payerTier === 'average' ? 0.14 : 0.2
    let overdueStreak = 0
    for (let m = 0; m < cfg.rentalMonths; m++) {
      const issue = new Date(rentStart + m * 30 * 86400000)
      const due = new Date(issue.getTime() + 30 * 86400000)
      const totalRent = Math.round(c.areaM2 * c.rentalRatePerM2)
      const roll = rng.float(0, 1)
      let status: PaymentStatus
      if (roll < overdueProb) status = 'Overdue'
      else if (roll < overdueProb + pendingProb) status = 'Pending'
      else status = 'Paid'
      if (due.getTime() > now && status === 'Overdue') status = 'Pending'
      const paid = status === 'Paid'
      overdueStreak = status === 'Overdue' ? overdueStreak + 1 : 0
      const monthsOverdue = status === 'Overdue' ? overdueStreak : 0
      const penalty = monthsOverdue > 0 ? Math.round(totalRent * 0.02 * monthsOverdue) : 0
      rentalInvoices.push({
        id: `INV-${c.id}-${m + 1}`,
        tenantId: c.id,
        companyName: c.name,
        areaM2: c.areaM2,
        ratePerM2: c.rentalRatePerM2,
        totalRent,
        period: `${1405 + Math.floor(m / 12)}/${(m % 12) + 1}`,
        issueDate: isoDate(issue),
        dueDate: isoDate(due),
        paymentDate: paid ? isoDate(new Date(issue.getTime() + rng.int(-3, 20) * 86400000)) : null,
        status,
        monthsOverdue,
        penalty,
        gateAccessRevoked: monthsOverdue >= 2,
      })
      if (!paid && due.getTime() < now) {
        debtByCompany.set(c.id, (debtByCompany.get(c.id) ?? 0) + totalRent + penalty)
      }
    }
  }
  const companyHasDebt = (id: string) => (debtByCompany.get(id) ?? 0) > 0

  const plates = Array.from({ length: 120 }, () => faker.licensePlate())
  const vehicles: VehicleLog[] = Array.from({ length: cfg.vehicleRecords }, () => {
    const origin = rng.pick(companies)
    const dest = rng.pick(companies)
    const entry = faker.dateBetween(-cfg.attendanceDays, 0, now)
    const status = rng.weighted(['Inbound', 'Outbound', 'Pending'] as const, [0.45, 0.45, 0.1])
    const exit = status === 'Outbound' ? new Date(entry.getTime() + rng.int(20, 600) * 60000) : null
    return {
      equipmentId: `EQ${rng.int(1000, 9999)}`,
      companyOrigin: origin.id,
      companyDest: dest.id,
      entryTime: iso(entry),
      exitTime: exit ? iso(exit) : null,
      licensePlate: rng.pick(plates),
      rfidTag: `RF${rng.int(10000, 99999)}`,
      status,
      authorized: !companyHasDebt(origin.id) && rng.bool(0.97),
    }
  })

  const bookings: MeetingBooking[] = Array.from({ length: cfg.bookings }, () => {
    const c = rng.pick(companies)
    const start = faker.dateBetween(-cfg.attendanceDays, 45, now)
    const duration = rng.pick([30, 60, 90, 120, 180])
    const status = rng.weighted(
      ['Confirmed', 'Completed', 'Cancelled'] as const satisfies readonly BookingStatus[],
      [0.55, 0.33, 0.12],
    )
    return {
      id: `B${rng.int(10000, 99999)}`,
      companyId: c.id,
      companyName: c.name,
      roomName: rng.pick(ROOMS),
      startTime: iso(start),
      endTime: iso(new Date(start.getTime() + duration * 60000)),
      durationMinutes: duration,
      participantCount: rng.int(2, 18),
      status,
      isVirtual: rng.bool(0.22),
    }
  })

  const STAGES = ['ایده', 'نمونه اولیه', 'MVP', 'رشد', 'مقیاس‌پذیری'] as const
  const PATENT: PatentStatus[] = ['ثبت‌شده', 'در حال ثبت', 'ندارد', 'در دست بررسی']
  const startups: StartupEvaluation[] = Array.from({ length: cfg.startups }, (_, i) => {
    const teamScore = rng.float(40, 95)
    const marketScore = rng.float(30, 90)
    const productScore = rng.float(35, 92)
    const aiFinalScore = teamScore * 0.3 + marketScore * 0.35 + productScore * 0.35
    const valuationRial = Math.round(
      aiFinalScore * 100_000_000 * rng.float(0.8, 2.5) * rng.float(0.5, 3),
    )
    return {
      id: `T${1000 + i}`,
      teamName: faker.teamName(),
      ideaTitle: faker.ideaTitle(),
      field: rng.pick(COMPANY_FIELDS),
      teamScore: +teamScore.toFixed(1),
      marketScore: +marketScore.toFixed(1),
      productScore: +productScore.toFixed(1),
      aiFinalScore: +aiFinalScore.toFixed(1),
      valuationRial,
      valuationUsd: Math.round(valuationRial / 620000),
      investmentRecommendation: aiFinalScore > 68,
      suggestedInvestmentRial: Math.round(valuationRial * rng.float(0.1, 0.4)),
      trlLevel: rng.int(3, 9),
      patentStatus: rng.pick(PATENT),
      stage: rng.pick(STAGES),
    }
  })

  const MARKETS: Array<[string, MarketRow['region']]> = [
    ['ایران', 'داخلی'], ['ترکیه', 'همسایه'], ['عراق', 'همسایه'], ['امارات', 'خاورمیانه'],
    ['عربستان', 'خاورمیانه'], ['قطر', 'خاورمیانه'], ['عمان', 'خاورمیانه'], ['کویت', 'خاورمیانه'],
    ['ترکمنستان', 'آسیای میانه'], ['قزاقستان', 'آسیای میانه'], ['آذربایجان', 'همسایه'],
    ['پاکستان', 'همسایه'], ['هند', 'شرق آسیا'], ['چین', 'شرق آسیا'], ['روسیه', 'همسایه'],
    ['نیجریه', 'آفریقا'], ['آنگولا', 'آفریقا'], ['ونزوئلا', 'آمریکای لاتین'],
    ['مالزی', 'شرق آسیا'], ['اندونزی', 'شرق آسیا'],
  ]
  const markets: MarketRow[] = MARKETS.map(([country, region]) => ({
    country,
    region,
    marketSizeUsd: Math.round(rng.float(100_000_000, 50_000_000_000)),
    growthRate: +rng.float(-5, 25).toFixed(1),
    competitorCount: rng.int(1, 48),
    tariffRate: +rng.float(0, 30).toFixed(1),
    easeOfBusiness: rng.int(20, 95),
    oilGasShare: +rng.float(10, 90).toFixed(1),
    techReadiness: rng.int(20, 95),
    politicalStability: rng.int(15, 95),
  }))

  const DOM_SECTORS = ['پالایش', 'پتروشیمی', 'اکتشاف و تولید', 'خطوط لوله', 'حفاری'] as const
  const BUYERS = [
    'شرکت ملی نفت ایران', 'شرکت ملی پالایش و پخش', 'شرکت ملی مناطق نفت‌خیز جنوب',
    'شرکت نفت مناطق مرکزی', 'پتروشیمی خلیج فارس', 'شرکت خطوط لوله و مخابرات نفت',
    'شرکت مهندسی و توسعه نفت',
  ]
  const domesticOpportunities: DomesticOpportunity[] = Array.from({ length: 40 }, (_, i) => ({
    id: `OPP-${2000 + i}`,
    title: faker.ideaTitle().replace('سامانه', 'تأمین'),
    buyer: rng.pick(BUYERS),
    sector: rng.pick(DOM_SECTORS),
    estimatedValueRial: Math.round(rng.float(5e9, 900e9)),
    deadline: isoDate(faker.dateBetween(-20, 120, now)),
    matchedCompanyIds: rng.sample(companies, rng.int(0, 4)).map((c) => c.id),
    status: rng.weighted(['باز', 'در حال ارزیابی', 'برنده', 'بسته'] as const, [0.5, 0.25, 0.1, 0.15]),
  }))

  const MENT_STATUS: MentoringStatus[] = ['در حال انجام', 'تکمیل‌شده', 'برنامه‌ریزی‌شده', 'متوقف']
  const mentoring: MentoringEngagement[] = []
  for (const c of companies) {
    for (const area of rng.sample(MENTORING_AREAS, rng.int(2, 4))) {
      const status = rng.weighted(MENT_STATUS, [0.42, 0.28, 0.2, 0.1])
      mentoring.push({
        id: `M-${c.id}-${area}`,
        companyId: c.id,
        companyName: c.name,
        area,
        startDate: isoDate(faker.dateBetween(-365, 0, now)),
        status,
        progressPercent:
          status === 'تکمیل‌شده' ? 100 : status === 'برنامه‌ریزی‌شده' ? 0 : rng.int(10, 92),
        mentorName: faker.name(),
        nextSession: isoDate(faker.dateBetween(1, 90, now)),
      })
    }
  }

  const EVENT_TYPES = [
    'دمو دی', 'ریورس پیچ', 'پیچ', 'کارگاه آموزشی', 'همایش', 'مسابقه نوآوری', 'شبکه‌سازی',
  ] as const
  const LOCATIONS = ['سالن همایش مرکزی', 'اتاق جلسات اصلی', 'محوطه باز پارک', 'سالن شماره ۲', 'پاویون نوآوری']
  const events: ParkEvent[] = Array.from({ length: cfg.events }, (_, i) => {
    const start = faker.dateBetween(-120, 150, now)
    const max = rng.int(20, 480)
    const past = start.getTime() < now
    const status: EventStatus = past
      ? rng.weighted(['برگزارشده', 'لغوشده'] as const, [0.9, 0.1])
      : rng.weighted(['برنامه‌ریزی‌شده', 'در حال برگزاری', 'لغوشده'] as const, [0.85, 0.08, 0.07])
    return {
      id: `E${1000 + i}`,
      title: `${rng.pick(EVENT_TYPES)} — ${faker.ideaTitle()}`,
      type: rng.pick(EVENT_TYPES),
      startDate: iso(start),
      endDate: iso(new Date(start.getTime() + rng.int(2, 8) * 3600000)),
      location: rng.pick(LOCATIONS),
      maxParticipants: max,
      registeredCount: rng.int(0, max),
      status,
    }
  })

  const balanceSheets: BalanceSheet[] = []
  for (const c of companies) {
    for (let p = 0; p < cfg.balancePeriods; p++) {
      const revenue = Math.round(rng.float(1e8, 5e10))
      const costs = Math.round(revenue * rng.float(0.3, 0.85))
      balanceSheets.push({
        companyId: c.id,
        companyName: c.name,
        period: `فصل ${p + 1} ۱۴۰۵`,
        revenue,
        costs,
        netProfit: revenue - costs,
        assets: Math.round(rng.float(2e8, 1e11)),
        liabilities: Math.round(rng.float(0, 5e10)),
        employeeGrowth: +rng.float(-10, 30).toFixed(1),
      })
    }
  }

  const FUND_STAGES = [
    'ثبت درخواست', 'بررسی اولیه', 'ارزیابی فنی', 'مذاکره', 'مصوب', 'رد شده',
  ] as const
  const fundingRequests: FundingRequest[] = Array.from({ length: cfg.fundingRequests }, (_, i) => {
    const c = rng.pick(companies)
    const stage = rng.weighted(FUND_STAGES, [0.2, 0.22, 0.22, 0.16, 0.12, 0.08])
    return {
      id: `FR-${3000 + i}`,
      companyId: c.id,
      companyName: c.name,
      fund: rng.pick(FUNDS),
      amountRequestedRial: Math.round(rng.float(2e9, 200e9)),
      stage,
      submittedDate: isoDate(faker.dateBetween(-300, -1, now)),
      successProbability: stage === 'مصوب' ? 100 : stage === 'رد شده' ? 0 : +rng.float(15, 88).toFixed(0),
    }
  })

  const notifications: Notification[] = []
  let nId = 1
  const pushNote = (n: Omit<Notification, 'id'>) => notifications.push({ id: `N${nId++}`, ...n })

  rentalInvoices
    .filter((r) => r.status === 'Overdue')
    .slice(0, 12)
    .forEach((r) =>
      pushNote({
        severity: r.monthsOverdue >= 2 ? 'critical' : 'warning',
        category: 'مالی',
        title: `بدهی اجاره‌بها — ${r.companyName}`,
        body:
          r.monthsOverdue >= 2
            ? `${r.monthsOverdue} ماه معوقه. دسترسی گیت و تشخیص چهره برای این شرکت غیرفعال شد.`
            : `صورتحساب دوره ${r.period} سررسید شده و پرداخت نشده است.`,
        createdAt: iso(faker.dateBetween(-7, 0, now)),
        read: rng.bool(0.3),
        audience: 'اپراتور',
      }),
    )
  vehicles
    .filter((v) => !v.authorized)
    .slice(0, 6)
    .forEach((v) =>
      pushNote({
        severity: 'warning',
        category: 'امنیتی',
        title: 'تلاش تردد غیرمجاز خودرو',
        body: `پلاک ${v.licensePlate} — گیت باز نشد (بدهی شرکت مبدأ یا نبود مجوز).`,
        createdAt: v.entryTime,
        read: rng.bool(0.5),
        audience: 'اپراتور',
      }),
    )
  events
    .filter((e) => e.status === 'برنامه‌ریزی‌شده')
    .slice(0, 8)
    .forEach((e) =>
      pushNote({
        severity: 'info',
        category: 'رویداد',
        title: `رویداد پیش‌رو: ${e.type}`,
        body: `${e.title} — ${e.location}`,
        createdAt: iso(faker.dateBetween(-3, 0, now)),
        read: rng.bool(0.4),
        audience: 'همه',
      }),
    )
  fundingRequests
    .filter((f) => f.stage === 'مصوب')
    .slice(0, 5)
    .forEach((f) =>
      pushNote({
        severity: 'success',
        category: 'سرمایه‌گذاری',
        title: `تأمین مالی مصوب شد — ${f.companyName}`,
        body: `${f.fund} درخواست ${f.companyName} را تصویب کرد.`,
        createdAt: iso(faker.dateBetween(-10, 0, now)),
        read: rng.bool(0.5),
        audience: 'همه',
      }),
    )
  notifications.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

  return {
    companies,
    attendance,
    vehicles,
    rentalInvoices,
    bookings,
    startups,
    markets,
    domesticOpportunities,
    mentoring,
    events,
    balanceSheets,
    fundingRequests,
    notifications,
    generatedAt: new Date(now).toISOString(),
  }
}
