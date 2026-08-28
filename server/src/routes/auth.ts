import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { db, audit } from '../db/index.ts'
import { hashPassword, signToken, verifyPassword } from '../lib/auth.ts'
import { permissionsFor } from '../lib/rbac.ts'
import { requireAuth } from '../middleware/auth.ts'
import type { Role, User } from '../types.ts'

export const authRouter: ReturnType<typeof Router> = Router()

interface UserRow {
  id: string
  email: string
  password_hash: string
  name: string
  role: Role
  company_id: string | null
  created_at: string
}

const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  role: r.role,
  companyId: r.company_id,
  createdAt: r.created_at,
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'ایمیل یا رمز عبور نامعتبر است' })
    return
  }
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email) as UserRow | undefined
  if (!row || !(await verifyPassword(parsed.data.password, row.password_hash))) {
    res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' })
    return
  }
  const user = toUser(row)
  audit({ userId: user.id, role: user.role, action: 'auth.login' })
  res.json({ token: signToken(user), user, permissions: permissionsFor(user.role) })
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['company', 'startup', 'investor', 'mentor']),
  companyId: z.string().optional(),
})

// ثبت‌نام عمومی فقط برای نقش‌های بیرونی (شرکت/استارتاپ/سرمایه‌گذار/منتور)
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'اطلاعات ثبت‌نام ناقص یا نامعتبر است', details: parsed.error.flatten() })
    return
  }
  const { email, password, name, role, companyId } = parsed.data
  if ((role === 'company' || role === 'startup') && !companyId) {
    res.status(400).json({ error: 'برای نقش شرکت/استارتاپ، شناسه شرکت الزامی است' })
    return
  }
  if (companyId) {
    const c = db.prepare("SELECT id FROM entities WHERE collection = 'companies' AND id = ?").get(companyId)
    if (!c) {
      res.status(400).json({ error: 'شرکت با این شناسه یافت نشد' })
      return
    }
  }
  const dup = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (dup) {
    res.status(409).json({ error: 'این ایمیل قبلاً ثبت شده است' })
    return
  }
  const id = randomUUID()
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, email, await hashPassword(password), name, role, companyId ?? null, new Date().toISOString())
  const user: User = {
    id,
    email,
    name,
    role,
    companyId: companyId ?? null,
    createdAt: new Date().toISOString(),
  }
  audit({ userId: id, role, action: 'auth.register' })
  res.status(201).json({ token: signToken(user), user, permissions: permissionsFor(role) })
})

authRouter.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.userId) as UserRow | undefined
  if (!row) {
    res.status(404).json({ error: 'کاربر یافت نشد' })
    return
  }
  const user = toUser(row)
  res.json({ user, permissions: permissionsFor(user.role) })
})
