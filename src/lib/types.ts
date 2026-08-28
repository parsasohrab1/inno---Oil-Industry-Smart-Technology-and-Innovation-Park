// ===== مدل داده دامنه — سامانه پارک هوشمند نفت (OIPMS) =====

export type Id = string

export type PaymentStatus = 'Paid' | 'Overdue' | 'Pending'
export type BookingStatus = 'Confirmed' | 'Cancelled' | 'Completed'
export type VehicleStatus = 'Inbound' | 'Outbound' | 'Pending'
export type MentoringStatus = 'در حال انجام' | 'تکمیل‌شده' | 'برنامه‌ریزی‌شده' | 'متوقف'
export type EventStatus = 'برگزارشده' | 'در حال برگزاری' | 'برنامه‌ریزی‌شده' | 'لغوشده'
export type PatentStatus = 'ثبت‌شده' | 'در حال ثبت' | 'ندارد' | 'در دست بررسی'

export const MENTORING_AREAS = [
  'کسب‌وکار',
  'دانش‌بنیان',
  'دریافت ایزو',
  'راه‌اندازی خط تولید',
  'دریافت تسهیلات',
  'ثبت اختراع',
] as const
export type MentoringArea = (typeof MENTORING_AREAS)[number]

export const COMPANY_FIELDS = [
  'نفت و گاز',
  'پالایش',
  'پتروشیمی',
  'انرژی‌های تجدیدپذیر',
  'فناوری اطلاعات',
  'ماشین‌آلات صنعتی',
  'مشاوره مدیریت',
  'آزمایشگاهی',
] as const
export type CompanyField = (typeof COMPANY_FIELDS)[number]

export interface Company {
  id: Id
  name: string
  establishmentDate: string
  employeeCount: number
  field: CompanyField
  areaM2: number
  rentalRatePerM2: number
  maturityLevel: number // 1..5
  isKnowledgeBased: boolean
  hasPatent: boolean
}

export interface AttendanceRecord {
  userId: Id
  companyId: Id
  date: string
  checkIn: string
  checkOut: string
  gateId: string
}

export interface VehicleLog {
  equipmentId: Id
  companyOrigin: Id
  companyDest: Id
  entryTime: string
  exitTime: string | null
  licensePlate: string
  rfidTag: string
  status: VehicleStatus
  authorized: boolean
}

export interface RentalInvoice {
  id: Id
  tenantId: Id
  companyName: string
  areaM2: number
  ratePerM2: number
  totalRent: number
  period: string
  issueDate: string
  dueDate: string
  paymentDate: string | null
  status: PaymentStatus
  monthsOverdue: number
  penalty: number
  gateAccessRevoked: boolean
}

export interface MeetingBooking {
  id: Id
  companyId: Id
  companyName: string
  roomName: string
  startTime: string
  endTime: string
  durationMinutes: number
  participantCount: number
  status: BookingStatus
  isVirtual: boolean
}

export interface StartupEvaluation {
  id: Id
  teamName: string
  ideaTitle: string
  field: CompanyField
  teamScore: number
  marketScore: number
  productScore: number
  aiFinalScore: number
  valuationRial: number
  valuationUsd: number
  investmentRecommendation: boolean
  suggestedInvestmentRial: number
  trlLevel: number
  patentStatus: PatentStatus
  stage: 'ایده' | 'نمونه اولیه' | 'MVP' | 'رشد' | 'مقیاس‌پذیری'
}

export interface MarketRow {
  country: string
  region: 'داخلی' | 'همسایه' | 'آسیای میانه' | 'خاورمیانه' | 'آفریقا' | 'آمریکای لاتین' | 'شرق آسیا'
  marketSizeUsd: number
  growthRate: number
  competitorCount: number
  tariffRate: number
  easeOfBusiness: number
  oilGasShare: number
  techReadiness: number
  politicalStability: number
}

export interface DomesticOpportunity {
  id: Id
  title: string
  buyer: string
  sector: 'پالایش' | 'پتروشیمی' | 'اکتشاف و تولید' | 'خطوط لوله' | 'حفاری'
  estimatedValueRial: number
  deadline: string
  matchedCompanyIds: Id[]
  status: 'باز' | 'در حال ارزیابی' | 'برنده' | 'بسته'
}

export interface MentoringEngagement {
  id: Id
  companyId: Id
  companyName: string
  area: MentoringArea
  startDate: string
  status: MentoringStatus
  progressPercent: number
  mentorName: string
  nextSession: string
}

export interface ParkEvent {
  id: Id
  title: string
  type: 'دمو دی' | 'ریورس پیچ' | 'پیچ' | 'کارگاه آموزشی' | 'همایش' | 'مسابقه نوآوری' | 'شبکه‌سازی'
  startDate: string
  endDate: string
  location: string
  maxParticipants: number
  registeredCount: number
  status: EventStatus
}

export interface BalanceSheet {
  companyId: Id
  companyName: string
  period: string
  revenue: number
  costs: number
  netProfit: number
  assets: number
  liabilities: number
  employeeGrowth: number
}

export interface FundingRequest {
  id: Id
  companyId: Id
  companyName: string
  fund: string
  amountRequestedRial: number
  stage: 'ثبت درخواست' | 'بررسی اولیه' | 'ارزیابی فنی' | 'مذاکره' | 'مصوب' | 'رد شده'
  submittedDate: string
  successProbability: number
}

export interface Notification {
  id: Id
  severity: 'info' | 'warning' | 'critical' | 'success'
  category: 'مالی' | 'امنیتی' | 'رویداد' | 'سرمایه‌گذاری' | 'منتورینگ' | 'سیستمی'
  title: string
  body: string
  createdAt: string
  read: boolean
  audience: 'اپراتور' | 'شرکت‌ها' | 'همه'
}

export interface Dataset {
  companies: Company[]
  attendance: AttendanceRecord[]
  vehicles: VehicleLog[]
  rentalInvoices: RentalInvoice[]
  bookings: MeetingBooking[]
  startups: StartupEvaluation[]
  markets: MarketRow[]
  domesticOpportunities: DomesticOpportunity[]
  mentoring: MentoringEngagement[]
  events: ParkEvent[]
  balanceSheets: BalanceSheet[]
  fundingRequests: FundingRequest[]
  notifications: Notification[]
  generatedAt: string
}
