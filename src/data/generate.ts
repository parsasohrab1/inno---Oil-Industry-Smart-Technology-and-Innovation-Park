import { Rng } from '@/lib/rng'
import { Faker } from '@/lib/faker'
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
} from '@/lib/types'

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
  seed: Number(import.meta.env?.VITE_SYNTH_SEED ?? 42),
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
  now: Date.parse('2026-08-28T09:00:00'),
}

const ROOMS = [
  'Ferdowsi', 'Saadi', 'Hafez', 'Molavi', 'Khayyam', 'Nezami', 'Attar', 'Sanai',
  'Jami', 'Rudaki', 'Parvin', 'Shahriar', 'Saeb', 'Bidel', 'Baba Taher', 'Ouhadi',
]
const GATES = ['G1', 'G2', 'G3']
const FUNDS = [
  'Ministry of Petroleum Research and Technology Fund',
  'Innovation and Prosperity Fund',
  'National Development Fund — Oil Sector',
  'Parsian Venture Fund',
  'Oil Industry Angel Investors',
  'Knowledge-based Venture Capital Fund',
]

function iso(d: Date) {
  return d.toISOString()
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function generateDataset(partial: Partial<GenConfig> = {}): Dataset {
  const cfg = { ...DEFAULT_CONFIG, ...partial }
  const rng = new Rng(cfg.seed)
  const faker = new Faker(rng)
  const { now } = cfg

  // ===== 1. Companies =====
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

  // ===== 2. Attendance =====
  const attendance: AttendanceRecord[] = []
  const startDay = now - cfg.attendanceDays * 86400000
  for (const c of companies) {
    const emps = Math.min(c.employeeCount, cfg.attendanceEmployeesPerCompany)
    for (let e = 0; e < emps; e++) {
      const userId = `${c.id}-U${e + 1}`
      for (let d = 0; d < cfg.attendanceDays; d++) {
        const date = new Date(startDay + d * 86400000)
        const dow = date.getDay() // 5 = Friday in JS? In JS: 0=Sunday..6=Saturday; Friday=5
        if (dow === 5) continue
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

  // ===== 4. Rent payments (defined before vehicles so the debt status is known) =====
  const rentalInvoices: RentalInvoice[] = []
  const debtByCompany = new Map<string, number>()
  const rentStart = now - cfg.rentalMonths * 30 * 86400000
  for (const c of companies) {
    // company payment profile: most companies are reliable, a minority chronically delinquent
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
      // recent months may not be due yet
      if (due.getTime() > now && status === 'Overdue') status = 'Pending'
      const paid = status === 'Paid'
      overdueStreak = status === 'Overdue' ? overdueStreak + 1 : 0
      const monthsOverdue = status === 'Overdue' ? overdueStreak : 0
      const penalty = monthsOverdue > 0 ? Math.round(totalRent * 0.02 * monthsOverdue) : 0
      const paymentDate = paid
        ? isoDate(new Date(issue.getTime() + rng.int(-3, 20) * 86400000))
        : null
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
        paymentDate,
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

  // ===== 3. Vehicle traffic =====
  const plates = Array.from({ length: 120 }, () => faker.licensePlate())
  const vehicles: VehicleLog[] = Array.from({ length: cfg.vehicleRecords }, () => {
    const origin = rng.pick(companies)
    const dest = rng.pick(companies)
    const entry = faker.dateBetween(-cfg.attendanceDays, 0, now)
    const status = rng.weighted(['Inbound', 'Outbound', 'Pending'] as const, [0.45, 0.45, 0.1])
    const exit =
      status === 'Outbound'
        ? new Date(entry.getTime() + rng.int(20, 600) * 60000)
        : null
    // if the originating company is in debt, entry is not allowed (integration with the finance system)
    const authorized = !companyHasDebt(origin.id) && rng.bool(0.97)
    return {
      equipmentId: `EQ${rng.int(1000, 9999)}`,
      companyOrigin: origin.id,
      companyDest: dest.id,
      entryTime: iso(entry),
      exitTime: exit ? iso(exit) : null,
      licensePlate: rng.pick(plates),
      rfidTag: `RF${rng.int(10000, 99999)}`,
      status,
      authorized,
    }
  })

  // ===== 5. Meeting room booking =====
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

  // ===== 6. Startup evaluation and valuation =====
  const STAGES = ['Idea', 'Prototype', 'MVP', 'Growth', 'Scale-up'] as const
  const PATENT: PatentStatus[] = ['Registered', 'Pending registration', 'None', 'Under review']
  const startups: StartupEvaluation[] = Array.from({ length: cfg.startups }, (_, i) => {
    const teamScore = rng.float(40, 95)
    const marketScore = rng.float(30, 90)
    const productScore = rng.float(35, 92)
    const aiFinalScore = teamScore * 0.3 + marketScore * 0.35 + productScore * 0.35
    const base = aiFinalScore * 100_000_000
    const industryMul = rng.float(0.8, 2.5)
    const stageMul = rng.float(0.5, 3)
    const valuationRial = Math.round(base * industryMul * stageMul)
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

  // ===== 7. International market intelligence =====
  const MARKETS: Array<[string, MarketRow['region']]> = [
    ['Iran', 'Domestic'],
    ['Turkey', 'Neighboring'],
    ['Iraq', 'Neighboring'],
    ['UAE', 'Middle East'],
    ['Saudi Arabia', 'Middle East'],
    ['Qatar', 'Middle East'],
    ['Oman', 'Middle East'],
    ['Kuwait', 'Middle East'],
    ['Turkmenistan', 'Central Asia'],
    ['Kazakhstan', 'Central Asia'],
    ['Azerbaijan', 'Neighboring'],
    ['Pakistan', 'Neighboring'],
    ['India', 'East Asia'],
    ['China', 'East Asia'],
    ['Russia', 'Neighboring'],
    ['Nigeria', 'Africa'],
    ['Angola', 'Africa'],
    ['Venezuela', 'Latin America'],
    ['Malaysia', 'East Asia'],
    ['Indonesia', 'East Asia'],
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

  // ===== 8. Domestic market opportunities =====
  const DOM_SECTORS = ['Refining', 'Petrochemical', 'Exploration & Production', 'Pipelines', 'Drilling'] as const
  const BUYERS = [
    'National Iranian Oil Company',
    'National Iranian Oil Refining and Distribution Company',
    'National Iranian South Oil Company',
    'Central Oil Fields Company',
    'Persian Gulf Petrochemical',
    'Oil Pipelines and Telecommunication Company',
    'Oil Engineering and Development Company',
  ]
  const domesticOpportunities: DomesticOpportunity[] = Array.from({ length: 40 }, (_, i) => {
    const matched = rng.sample(companies, rng.int(0, 4)).map((c) => c.id)
    return {
      id: `OPP-${2000 + i}`,
      title: faker.ideaTitle().replace('system', 'supply'),
      buyer: rng.pick(BUYERS),
      sector: rng.pick(DOM_SECTORS),
      estimatedValueRial: Math.round(rng.float(5e9, 900e9)),
      deadline: isoDate(faker.dateBetween(-20, 120, now)),
      matchedCompanyIds: matched,
      status: rng.weighted(
        ['Open', 'Under evaluation', 'Won', 'Closed'] as const,
        [0.5, 0.25, 0.1, 0.15],
      ),
    }
  })

  // ===== 9. Mentoring =====
  const MENT_STATUS: MentoringStatus[] = ['In progress', 'Completed', 'Planned', 'Suspended']
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
          status === 'Completed' ? 100 : status === 'Planned' ? 0 : rng.int(10, 92),
        mentorName: faker.name(),
        nextSession: isoDate(faker.dateBetween(1, 90, now)),
      })
    }
  }

  // ===== 10. Events =====
  const EVENT_TYPES = [
    'Demo Day', 'Reverse Pitch', 'Pitch', 'Training workshop', 'Conference', 'Innovation competition', 'Networking',
  ] as const
  const LOCATIONS = ['Central conference hall', 'Main meeting room', 'Park open area', 'Hall No. 2', 'Innovation pavilion']
  const events: ParkEvent[] = Array.from({ length: cfg.events }, (_, i) => {
    const start = faker.dateBetween(-120, 150, now)
    const max = rng.int(20, 480)
    const past = start.getTime() < now
    const status: EventStatus = past
      ? rng.weighted(['Held', 'Cancelled'] as const, [0.9, 0.1])
      : rng.weighted(['Planned', 'In progress', 'Cancelled'] as const, [0.85, 0.08, 0.07])
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

  // ===== 11. Balance sheet =====
  const balanceSheets: BalanceSheet[] = []
  for (const c of companies) {
    for (let p = 0; p < cfg.balancePeriods; p++) {
      const revenue = Math.round(rng.float(1e8, 5e10))
      const costs = Math.round(revenue * rng.float(0.3, 0.85))
      balanceSheets.push({
        companyId: c.id,
        companyName: c.name,
        period: `Quarter ${p + 1} 1405`,
        revenue,
        costs,
        netProfit: revenue - costs,
        assets: Math.round(rng.float(2e8, 1e11)),
        liabilities: Math.round(rng.float(0, 5e10)),
        employeeGrowth: +rng.float(-10, 30).toFixed(1),
      })
    }
  }

  // ===== 12. Financing requests =====
  const FUND_STAGES = [
    'Request submitted', 'Initial review', 'Technical evaluation', 'Negotiation', 'Approved', 'Rejected',
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
      successProbability:
        stage === 'Approved' ? 100 : stage === 'Rejected' ? 0 : +rng.float(15, 88).toFixed(0),
    }
  })

  // ===== 13. Notifications (derived from the data above) =====
  const notifications: Notification[] = []
  let nId = 1
  const pushNote = (n: Omit<Notification, 'id'>) =>
    notifications.push({ id: `N${nId++}`, ...n })

  rentalInvoices
    .filter((r) => r.status === 'Overdue')
    .slice(0, 12)
    .forEach((r) =>
      pushNote({
        severity: r.monthsOverdue >= 2 ? 'critical' : 'warning',
        category: 'Financial',
        title: `Rent arrears — ${r.companyName}`,
        body:
          r.monthsOverdue >= 2
            ? `${r.monthsOverdue} months overdue. Gate access and face recognition were disabled for this company.`
            : `The invoice for period ${r.period} is due and has not been paid.`,
        createdAt: iso(faker.dateBetween(-7, 0, now)),
        read: rng.bool(0.3),
        audience: 'Operator',
      }),
    )

  vehicles
    .filter((v) => !v.authorized)
    .slice(0, 6)
    .forEach((v) =>
      pushNote({
        severity: 'warning',
        category: 'Security',
        title: 'Unauthorized vehicle entry attempt',
        body: `Plate ${v.licensePlate} — the gate did not open (debt of the originating company or no permit).`,
        createdAt: v.entryTime,
        read: rng.bool(0.5),
        audience: 'Operator',
      }),
    )

  events
    .filter((e) => e.status === 'Planned')
    .slice(0, 8)
    .forEach((e) =>
      pushNote({
        severity: 'info',
        category: 'Event',
        title: `Upcoming event: ${e.type}`,
        body: `${e.title} — ${e.location}`,
        createdAt: iso(faker.dateBetween(-3, 0, now)),
        read: rng.bool(0.4),
        audience: 'All',
      }),
    )

  fundingRequests
    .filter((f) => f.stage === 'Approved')
    .slice(0, 5)
    .forEach((f) =>
      pushNote({
        severity: 'success',
        category: 'Investment',
        title: `Financing approved — ${f.companyName}`,
        body: `${f.fund} approved the request of ${f.companyName}.`,
        createdAt: iso(faker.dateBetween(-10, 0, now)),
        read: rng.bool(0.5),
        audience: 'All',
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
