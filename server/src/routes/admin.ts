import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { audit, db } from '../db/index.ts'
import { hashPassword } from '../lib/auth.ts'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import { ROLES } from '../types.ts'

export const adminRouter: ReturnType<typeof Router> = Router()

adminRouter.use(requireAuth)

adminRouter.get('/users', requirePermission('users:manage'), (_req, res) => {
  res.json(
    db
      .prepare('SELECT id, email, name, role, company_id AS companyId, created_at AS createdAt FROM users ORDER BY created_at DESC')
      .all(),
  )
})

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(ROLES as [string, ...string[]]),
  companyId: z.string().nullable().optional(),
})

adminRouter.post('/users', requirePermission('users:manage'), async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'اطلاعات کاربر نامعتبر است', details: parsed.error.flatten() })
    return
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.email)) {
    res.status(409).json({ error: 'این ایمیل قبلاً ثبت شده است' })
    return
  }
  const id = randomUUID()
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    parsed.data.email,
    await hashPassword(parsed.data.password),
    parsed.data.name,
    parsed.data.role,
    parsed.data.companyId ?? null,
    new Date().toISOString(),
  )
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'user.create', target: id })
  res.status(201).json({ id })
})

adminRouter.delete('/users/:id', requirePermission('users:manage'), (req, res) => {
  if (req.params.id === req.auth!.userId) {
    res.status(400).json({ error: 'نمی‌توانید حساب خودتان را حذف کنید' })
    return
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  audit({ userId: req.auth!.userId, role: req.auth!.role, action: 'user.delete', target: req.params.id })
  res.json({ ok: true })
})

adminRouter.get('/audit', requirePermission('audit:read'), (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 200), 1000)
  res.json(db.prepare('SELECT * FROM audit_log ORDER BY ts DESC LIMIT ?').all(limit))
})
