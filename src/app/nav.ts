import {
  LayoutDashboard,
  Boxes,
  Building2,
  Coins,
  TrendingUp,
  Globe2,
  GraduationCap,
  ShieldCheck,
  CalendarDays,
  Rocket,
  Bell,
  DoorOpen,
  FileText,
  ScrollText,
  Users,
  Briefcase,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/store/auth'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  group: string
  roles: Role[]
}

const ALL: Role[] = ['admin', 'operator', 'company', 'startup', 'investor', 'mentor']
const STAFF: Role[] = ['admin', 'operator']

export const NAV: NavItem[] = [
  { to: '/', label: 'نمای کلی پارک', icon: LayoutDashboard, group: 'مدیریت', roles: STAFF },
  { to: '/digital-twin', label: 'دوقلوی دیجیتال', icon: Boxes, group: 'مدیریت', roles: STAFF },
  {
    to: '/companies',
    label: 'شرکت‌های مستقر',
    icon: Building2,
    group: 'مدیریت',
    roles: ['admin', 'operator', 'investor', 'mentor'],
  },
  { to: '/contracts', label: 'قراردادهای هوشمند', icon: ScrollText, group: 'مدیریت', roles: STAFF },
  { to: '/reports', label: 'گزارش‌گیری', icon: FileText, group: 'مدیریت', roles: ['admin', 'operator', 'company', 'startup'] },
  { to: '/admin/users', label: 'مدیریت کاربران', icon: Users, group: 'مدیریت', roles: ['admin'] },

  { to: '/investment', label: 'جذب سرمایه', icon: Coins, group: 'توسعه', roles: STAFF },
  { to: '/market/domestic', label: 'توسعه بازار داخلی', icon: TrendingUp, group: 'توسعه', roles: STAFF },
  { to: '/market/international', label: 'توسعه بازار بین‌المللی', icon: Globe2, group: 'توسعه', roles: STAFF },
  { to: '/mentoring', label: 'منتورینگ', icon: GraduationCap, group: 'توسعه', roles: STAFF },
  {
    to: '/startups',
    label: 'داوری و ارزش‌گذاری',
    icon: Rocket,
    group: 'توسعه',
    roles: ['admin', 'operator', 'investor'],
  },

  { to: '/finance', label: 'مالی و اجاره‌بها', icon: Coins, group: 'عملیات', roles: STAFF },
  { to: '/access', label: 'تردد و امنیت', icon: ShieldCheck, group: 'عملیات', roles: STAFF },
  { to: '/facilities', label: 'فضاها و رزرو جلسات', icon: DoorOpen, group: 'عملیات', roles: STAFF },
  { to: '/events', label: 'رویدادها', icon: CalendarDays, group: 'عملیات', roles: STAFF },
  { to: '/notifications', label: 'نوتیفیکیشن‌ها', icon: Bell, group: 'عملیات', roles: STAFF },

  { to: '/company', label: 'پنل شرکت', icon: Briefcase, group: 'میز کار من', roles: ['company', 'startup'] },
  { to: '/company/contracts', label: 'قراردادهای من', icon: ScrollText, group: 'میز کار من', roles: ['company', 'startup'] },
  { to: '/company/reports', label: 'گزارش‌های من', icon: FileText, group: 'میز کار من', roles: ['company', 'startup'] },
  { to: '/investor', label: 'میز سرمایه‌گذاری', icon: TrendingUp, group: 'میز کار من', roles: ['investor'] },
  { to: '/mentor', label: 'میز منتورینگ', icon: GraduationCap, group: 'میز کار من', roles: ['mentor'] },
  { to: '/events', label: 'رویدادهای پارک', icon: CalendarDays, group: 'میز کار من', roles: ['company', 'startup', 'investor', 'mentor'] },
  { to: '/notifications', label: 'اعلان‌ها', icon: Bell, group: 'میز کار من', roles: ['company', 'startup', 'investor', 'mentor'] },
]

export const NAV_GROUPS = ['مدیریت', 'توسعه', 'عملیات', 'میز کار من'] as const

export function navForRole(role: Role | undefined): NavItem[] {
  if (!role) return []
  return NAV.filter((n) => n.roles.includes(role))
}

export { ALL as ALL_ROLES }
