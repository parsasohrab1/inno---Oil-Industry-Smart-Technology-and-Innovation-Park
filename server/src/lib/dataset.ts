import { getMeta, listEntities } from '../db/index.ts'
import type {
  AttendanceRecord,
  BalanceSheet,
  Company,
  Dataset,
  DomesticOpportunity,
  FundingRequest,
  MarketRow,
  MeetingBooking,
  MentoringEngagement,
  Notification,
  ParkEvent,
  RentalInvoice,
  StartupEvaluation,
  VehicleLog,
} from '../types.ts'

export function assembleDataset(): Dataset {
  return {
    companies: listEntities<Company>('companies'),
    attendance: listEntities<AttendanceRecord>('attendance'),
    vehicles: listEntities<VehicleLog>('vehicles'),
    rentalInvoices: listEntities<RentalInvoice>('rentalInvoices'),
    bookings: listEntities<MeetingBooking>('bookings'),
    startups: listEntities<StartupEvaluation>('startups'),
    markets: listEntities<MarketRow>('markets'),
    domesticOpportunities: listEntities<DomesticOpportunity>('domesticOpportunities'),
    mentoring: listEntities<MentoringEngagement>('mentoring'),
    events: listEntities<ParkEvent>('events'),
    balanceSheets: listEntities<BalanceSheet>('balanceSheets'),
    fundingRequests: listEntities<FundingRequest>('fundingRequests'),
    notifications: listEntities<Notification>('notifications'),
    generatedAt: getMeta('generatedAt') ?? new Date().toISOString(),
  }
}

/** برش دیتاست برای یک شرکت خاص (کاربران نقش شرکت/استارتاپ) */
export function assembleCompanyDataset(companyId: string): Partial<Dataset> & { company: Company | null } {
  const company = listEntities<Company>('companies', companyId)[0] ?? null
  return {
    company,
    companies: company ? [company] : [],
    rentalInvoices: listEntities<RentalInvoice>('rentalInvoices', companyId),
    bookings: listEntities<MeetingBooking>('bookings', companyId),
    mentoring: listEntities<MentoringEngagement>('mentoring', companyId),
    fundingRequests: listEntities<FundingRequest>('fundingRequests', companyId),
    balanceSheets: listEntities<BalanceSheet>('balanceSheets', companyId),
    events: listEntities<ParkEvent>('events'),
    notifications: listEntities<Notification>('notifications').filter((n) => n.audience !== 'اپراتور'),
    generatedAt: getMeta('generatedAt') ?? new Date().toISOString(),
  }
}
