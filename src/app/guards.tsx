/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type Role } from '@/store/auth'
import { LoadingState } from '@/components/PageState'

/** Session bootstrap: on first load, validates the stored token. */
export function useAuthBootstrap() {
  const { status, loadMe } = useAuth()
  useEffect(() => {
    if (status === 'loading') void loadMe()
  }, [status, loadMe])
  return status
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthBootstrap()
  const location = useLocation()

  if (status === 'loading') return <LoadingState label="Checking session…" />
  if (status === 'anon') return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

/** Default landing route of each role after authentication. */
export const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/',
  operator: '/',
  company: '/company',
  startup: '/company',
  investor: '/investor',
  mentor: '/mentor',
}

export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user, status } = useAuth()
  if (status === 'loading') return <LoadingState label="Checking access…" />
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role]} replace />
  return <>{children}</>
}
