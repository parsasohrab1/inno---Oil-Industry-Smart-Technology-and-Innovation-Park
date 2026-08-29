import { create } from 'zustand'
import { api, getToken, setToken } from '@/lib/api'

export type Role = 'admin' | 'operator' | 'company' | 'startup' | 'investor' | 'mentor'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  companyId: string | null
  createdAt: string
}

interface LoginResponse {
  token: string
  user: AuthUser
  permissions: string[]
}

interface MeResponse {
  user: AuthUser
  permissions: string[]
}

interface AuthState {
  user: AuthUser | null
  permissions: string[]
  status: 'idle' | 'loading' | 'authed' | 'anon'
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    email: string
    password: string
    name: string
    role: Exclude<Role, 'admin' | 'operator'>
    companyId?: string
  }) => Promise<void>
  loadMe: () => Promise<void>
  logout: () => void
  can: (perm: string) => boolean
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
  status: getToken() ? 'loading' : 'anon',

  login: async (email, password) => {
    const res = await api.post<LoginResponse>('/api/auth/login', { email, password })
    setToken(res.token)
    set({ user: res.user, permissions: res.permissions, status: 'authed' })
  },

  register: async (payload) => {
    const res = await api.post<LoginResponse>('/api/auth/register', payload)
    setToken(res.token)
    set({ user: res.user, permissions: res.permissions, status: 'authed' })
  },

  loadMe: async () => {
    if (!getToken()) {
      set({ status: 'anon' })
      return
    }
    try {
      const res = await api.get<MeResponse>('/api/auth/me')
      set({ user: res.user, permissions: res.permissions, status: 'authed' })
    } catch {
      setToken(null)
      set({ user: null, permissions: [], status: 'anon' })
    }
  },

  logout: () => {
    setToken(null)
    set({ user: null, permissions: [], status: 'anon' })
    location.href = '/login'
  },

  can: (perm) => get().permissions.includes(perm),
}))
