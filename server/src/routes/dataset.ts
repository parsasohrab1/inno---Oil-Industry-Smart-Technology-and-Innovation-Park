import { Router } from 'express'
import { requireAuth, requirePermission } from '../middleware/auth.ts'
import { assembleCompanyDataset, assembleDataset } from '../lib/dataset.ts'

export const datasetRouter: ReturnType<typeof Router> = Router()

// Full dataset — operator/manager only
datasetRouter.get('/dataset', requireAuth, requirePermission('dataset:read:all'), (_req, res) => {
  res.json(assembleDataset())
})

// Dataset slice specific to the current user's company
datasetRouter.get('/dataset/mine', requireAuth, (req, res) => {
  if (!req.auth?.companyId) {
    res.status(403).json({ error: 'This account is not linked to a company' })
    return
  }
  res.json(assembleCompanyDataset(req.auth.companyId))
})
