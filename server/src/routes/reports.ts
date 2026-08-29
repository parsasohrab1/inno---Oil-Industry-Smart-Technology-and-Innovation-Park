import { Router } from 'express'
import { audit } from '../db/index.ts'
import { requireAuth } from '../middleware/auth.ts'
import { can } from '../lib/rbac.ts'
import { REPORTS, toCsv, toPrintableHtml, toXlsx } from '../lib/reports.ts'

export const reportsRouter: ReturnType<typeof Router> = Router()

reportsRouter.use(requireAuth)

reportsRouter.get('/', (req, res) => {
  const role = req.auth!.role
  res.json(
    Object.values(REPORTS)
      .filter((d) => (d.scope === 'all' ? can(role, 'reports:generate:all') : true))
      .map((d) => ({ id: d.id, title: d.title, scope: d.scope, formats: ['html', 'csv', 'xlsx'] })),
  )
})

reportsRouter.get('/:id.:format', async (req, res) => {
  const def = REPORTS[req.params.id]
  const format = req.params.format
  if (!def) {
    res.status(404).json({ error: 'گزارش یافت نشد' })
    return
  }
  const role = req.auth!.role
  if (def.scope === 'all' && !can(role, 'reports:generate:all')) {
    res.status(403).json({ error: 'دسترسی به این گزارش مجاز نیست' })
    return
  }
  // گزارش‌های با دامنه own برای کاربران شرکت فقط داده خودشان
  const companyId =
    def.scope === 'own' && !can(role, 'reports:generate:all')
      ? (req.auth!.companyId ?? undefined)
      : (typeof req.query.companyId === 'string' ? req.query.companyId : undefined)

  if (def.scope === 'own' && !can(role, 'reports:generate:all') && !companyId) {
    res.status(403).json({ error: 'این حساب به شرکتی متصل نیست' })
    return
  }

  const rows = def.rows({ companyId })
  audit({
    userId: req.auth!.userId,
    role,
    action: 'report.generate',
    target: def.id,
    meta: { format, rows: rows.length },
  })

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${def.id}.csv"`)
    res.send(toCsv(def, rows))
    return
  }
  if (format === 'xlsx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${def.id}.xlsx"`)
    res.send(await toXlsx(def, rows))
    return
  }
  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(toPrintableHtml(def, rows))
    return
  }
  res.status(400).json({ error: 'فرمت پشتیبانی نمی‌شود (html | csv | xlsx)' })
})
