import { Router } from 'express'
import { getEntity, listEntities, putEntity } from '../db/index.ts'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import type { Notification, ParkEvent } from '../types.ts'

export const miscRouter: ReturnType<typeof Router> = Router()

miscRouter.use(requireAuth)

// رویدادهای پارک — همه نقش‌های واردشده
miscRouter.get('/events', (_req, res) => {
  res.json(listEntities<ParkEvent>('events'))
})

// نوتیفیکیشن‌ها — اپراتور همه، سایرین بدون اعلان‌های مخصوص اپراتور
miscRouter.get('/notifications', (req, res) => {
  const all = listEntities<Notification>('notifications')
  const staff = req.auth!.role === 'admin' || req.auth!.role === 'operator'
  res.json(staff ? all : all.filter((n) => n.audience !== 'اپراتور'))
})

miscRouter.post('/notifications/:id/read', (req, res) => {
  const n = getEntity<Notification>('notifications', req.params.id)
  if (!n) {
    res.status(404).json({ error: 'نوتیفیکیشن یافت نشد' })
    return
  }
  n.read = true
  putEntity('notifications', n.id, null, n)
  res.json({ ok: true })
})

// همه اعلام‌های علاقه سرمایه‌گذاران — برای اپراتور/مدیر
miscRouter.get('/investment/interests', requirePermission('investment:read'), (_req, res) => {
  res.json(listEntities('investorInterests'))
})
