import { Router } from 'express'
import { getEntity, listEntities, putEntity } from '../db/index.ts'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import type { Notification, ParkEvent } from '../types.ts'

export const miscRouter: ReturnType<typeof Router> = Router()

miscRouter.use(requireAuth)

// Park events — all logged-in roles
miscRouter.get('/events', (_req, res) => {
  res.json(listEntities<ParkEvent>('events'))
})

// Notifications — operator sees all, others without operator-specific notifications
miscRouter.get('/notifications', (req, res) => {
  const all = listEntities<Notification>('notifications')
  const staff = req.auth!.role === 'admin' || req.auth!.role === 'operator'
  res.json(staff ? all : all.filter((n) => n.audience !== 'Operator'))
})

miscRouter.post('/notifications/:id/read', (req, res) => {
  const n = getEntity<Notification>('notifications', req.params.id)
  if (!n) {
    res.status(404).json({ error: 'Notification not found' })
    return
  }
  n.read = true
  putEntity('notifications', n.id, null, n)
  res.json({ ok: true })
})

// All investor expressions of interest — for operator/manager
miscRouter.get('/investment/interests', requirePermission('investment:read'), (_req, res) => {
  res.json(listEntities('investorInterests'))
})
