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
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  group: string
}

export const NAV: NavItem[] = [
  { to: '/', label: 'نمای کلی پارک', icon: LayoutDashboard, group: 'مدیریت' },
  { to: '/digital-twin', label: 'دوقلوی دیجیتال', icon: Boxes, group: 'مدیریت' },
  { to: '/companies', label: 'شرکت‌های مستقر', icon: Building2, group: 'مدیریت' },

  { to: '/investment', label: 'جذب سرمایه', icon: Coins, group: 'توسعه' },
  { to: '/market/domestic', label: 'توسعه بازار داخلی', icon: TrendingUp, group: 'توسعه' },
  { to: '/market/international', label: 'توسعه بازار بین‌المللی', icon: Globe2, group: 'توسعه' },
  { to: '/mentoring', label: 'منتورینگ', icon: GraduationCap, group: 'توسعه' },
  { to: '/startups', label: 'داوری و ارزش‌گذاری', icon: Rocket, group: 'توسعه' },

  { to: '/finance', label: 'مالی و اجاره‌بها', icon: Coins, group: 'عملیات' },
  { to: '/access', label: 'تردد و امنیت', icon: ShieldCheck, group: 'عملیات' },
  { to: '/facilities', label: 'فضاها و رزرو جلسات', icon: DoorOpen, group: 'عملیات' },
  { to: '/events', label: 'رویدادها', icon: CalendarDays, group: 'عملیات' },
  { to: '/notifications', label: 'نوتیفیکیشن‌ها', icon: Bell, group: 'عملیات' },
]

export const NAV_GROUPS = ['مدیریت', 'توسعه', 'عملیات'] as const
