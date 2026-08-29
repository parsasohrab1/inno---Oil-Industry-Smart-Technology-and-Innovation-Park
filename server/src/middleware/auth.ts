import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../lib/auth.ts'
import { can, type Permission } from '../lib/rbac.ts'
import type { Role } from '../types.ts'

export interface AuthContext {
  userId: string
  role: Role
  companyId: string | null
  name: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'نیاز به احراز هویت' })
    return
  }
  try {
    const payload = verifyToken(token)
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      companyId: payload.companyId,
      name: payload.name,
    }
    next()
  } catch {
    res.status(401).json({ error: 'توکن نامعتبر یا منقضی‌شده' })
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'نیاز به احراز هویت' })
      return
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'دسترسی این نقش مجاز نیست' })
      return
    }
    next()
  }
}

export function requirePermission(perm: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'نیاز به احراز هویت' })
      return
    }
    if (!can(req.auth.role, perm)) {
      res.status(403).json({ error: `مجوز لازم را ندارید: ${perm}` })
      return
    }
    next()
  }
}

/** برای کاربران شرکت/استارتاپ، companyId الزامی است */
export function requireOwnCompany(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth?.companyId) {
    res.status(403).json({ error: 'این حساب به هیچ شرکتی متصل نیست' })
    return
  }
  next()
}
