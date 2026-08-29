import { Router } from 'express'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import { assembleCompanyDataset, assembleDataset } from '../lib/dataset.ts'

export const datasetRouter: ReturnType<typeof Router> = Router()

// دیتاست کامل — فقط اپراتور/مدیر
datasetRouter.get('/dataset', requireAuth, requirePermission('dataset:read:all'), (_req, res) => {
  res.json(assembleDataset())
})

// برش دیتاست مخصوص شرکتِ کاربر جاری
datasetRouter.get('/dataset/mine', requireAuth, (req, res) => {
  if (!req.auth?.companyId) {
    res.status(403).json({ error: 'این حساب به شرکتی متصل نیست' })
    return
  }
  res.json(assembleCompanyDataset(req.auth.companyId))
})
