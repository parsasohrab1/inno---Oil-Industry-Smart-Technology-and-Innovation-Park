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
  Store,
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
  { to: '/', label: 'Park overview', icon: LayoutDashboard, group: 'Management', roles: STAFF },
  { to: '/digital-twin', label: 'Digital twin', icon: Boxes, group: 'Management', roles: STAFF },
  {
    to: '/companies',
    label: 'Resident companies',
    icon: Building2,
    group: 'Management',
    roles: ['admin', 'operator', 'investor', 'mentor'],
  },
  { to: '/contracts', label: 'Smart contracts', icon: ScrollText, group: 'Management', roles: STAFF },
  { to: '/reports', label: 'Reporting', icon: FileText, group: 'Management', roles: ['admin', 'operator', 'company', 'startup'] },
  { to: '/admin/users', label: 'User management', icon: Users, group: 'Management', roles: ['admin'] },

  { to: '/investment', label: 'Fundraising', icon: Coins, group: 'Development', roles: STAFF },
  { to: '/market/domestic', label: 'Domestic market development', icon: TrendingUp, group: 'Development', roles: STAFF },
  { to: '/market/international', label: 'International market development', icon: Globe2, group: 'Development', roles: STAFF },
  { to: '/mentoring', label: 'Mentoring', icon: GraduationCap, group: 'Development', roles: STAFF },
  {
    to: '/startups',
    label: 'Judging and valuation',
    icon: Rocket,
    group: 'Development',
    roles: ['admin', 'operator', 'investor'],
  },
  { to: '/tech-bazaar', label: 'Tech Bazaar', icon: Store, group: 'Development', roles: ALL },

  { to: '/finance', label: 'Finance and rent', icon: Coins, group: 'Operations', roles: STAFF },
  { to: '/access', label: 'Traffic and security', icon: ShieldCheck, group: 'Operations', roles: STAFF },
  { to: '/facilities', label: 'Spaces and meeting booking', icon: DoorOpen, group: 'Operations', roles: STAFF },
  { to: '/events', label: 'Events', icon: CalendarDays, group: 'Operations', roles: STAFF },
  { to: '/notifications', label: 'Notifications', icon: Bell, group: 'Operations', roles: STAFF },

  { to: '/company', label: 'Company panel', icon: Briefcase, group: 'My Desk', roles: ['company', 'startup'] },
  { to: '/company/contracts', label: 'My contracts', icon: ScrollText, group: 'My Desk', roles: ['company', 'startup'] },
  { to: '/company/reports', label: 'My reports', icon: FileText, group: 'My Desk', roles: ['company', 'startup'] },
  { to: '/investor', label: 'Investment desk', icon: TrendingUp, group: 'My Desk', roles: ['investor'] },
  { to: '/mentor', label: 'Mentoring desk', icon: GraduationCap, group: 'My Desk', roles: ['mentor'] },
  { to: '/events', label: 'Park events', icon: CalendarDays, group: 'My Desk', roles: ['company', 'startup', 'investor', 'mentor'] },
  { to: '/notifications', label: 'Alerts', icon: Bell, group: 'My Desk', roles: ['company', 'startup', 'investor', 'mentor'] },
]

export const NAV_GROUPS = ['Management', 'Development', 'Operations', 'My Desk'] as const

export function navForRole(role: Role | undefined): NavItem[] {
  if (!role) return []
  return NAV.filter((n) => n.roles.includes(role))
}

export { ALL as ALL_ROLES }
