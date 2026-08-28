import { Router } from 'express'
import { getEntity, listEntities, putEntity } from '../db/index.ts'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import type { Notification } from '../types.ts'

export const miscRouter: ReturnType<typeof Router> = Router()

miscRouter.use(requireAuth)

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
