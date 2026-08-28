import type { Role } from '../types.ts'

export type Permission =
  | 'dataset:read:all'
  | 'companies:read:all'
  | 'company:read:own'
  | 'company:manage:own'
  | 'invoices:read:all'
  | 'invoices:read:own'
  | 'invoices:pay:own'
  | 'contracts:read:all'
  | 'contracts:read:own'
  | 'contracts:create'
  | 'contracts:sign:park'
  | 'contracts:sign:tenant'
  | 'contracts:run-conditions'
  | 'contracts:terminate'
  | 'mentoring:read:all'
  | 'mentoring:read:own'
  | 'mentoring:read:assigned'
  | 'mentoring:log-session'
  | 'mentoring:update-progress'
  | 'startups:read:all'
  | 'startups:manage:own'
  | 'investment:read'
  | 'investment:express-interest'
  | 'funding:read:all'
  | 'funding:read:own'
  | 'funding:apply:own'
  | 'bookings:read:all'
  | 'bookings:read:own'
  | 'bookings:create:own'
  | 'bookings:cancel:own'
  | 'events:read'
  | 'reports:generate:all'
  | 'reports:generate:own'
  | 'notifications:read'
  | 'users:manage'
  | 'audit:read'

const OPERATOR: Permission[] = [
  'dataset:read:all',
  'companies:read:all',
  'invoices:read:all',
  'contracts:read:all',
  'contracts:create',
  'contracts:run-conditions',
  'mentoring:read:all',
  'startups:read:all',
  'investment:read',
  'funding:read:all',
  'bookings:read:all',
  'bookings:cancel:own',
  'events:read',
  'reports:generate:all',
  'notifications:read',
  'audit:read',
]

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    ...OPERATOR,
    'contracts:sign:park',
    'contracts:terminate',
    'users:manage',
  ],
  operator: OPERATOR,
  company: [
    'company:read:own',
    'company:manage:own',
    'invoices:read:own',
    'invoices:pay:own',
    'contracts:read:own',
    'contracts:sign:tenant',
    'mentoring:read:own',
    'funding:read:own',
    'funding:apply:own',
    'bookings:read:own',
    'bookings:create:own',
    'bookings:cancel:own',
    'events:read',
    'reports:generate:own',
    'notifications:read',
  ],
  startup: [
    'company:read:own',
    'startups:manage:own',
    'mentoring:read:own',
    'funding:read:own',
    'funding:apply:own',
    'investment:read',
    'events:read',
    'notifications:read',
  ],
  investor: [
    'companies:read:all',
    'startups:read:all',
    'investment:read',
    'investment:express-interest',
    'funding:read:all',
    'events:read',
    'notifications:read',
  ],
  mentor: [
    'mentoring:read:assigned',
    'mentoring:log-session',
    'mentoring:update-progress',
    'companies:read:all',
    'events:read',
    'notifications:read',
  ],
}

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function can(role: Role, perm: Permission): boolean {
  return permissionsFor(role).includes(perm)
}
