import 'dotenv/config'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from './middleware/rateLimit.ts'
import { db, listEntities, migrate, getMeta } from './db/index.ts'
import { seed } from './db/seed.ts'
import { authRouter } from './routes/auth.ts'
import { datasetRouter } from './routes/dataset.ts'
import { companyRouter } from './routes/company.ts'
import { contractsRouter } from './routes/contracts.ts'
import { mentorRouter } from './routes/mentor.ts'
import { investorRouter } from './routes/investor.ts'
import { reportsRouter } from './routes/reports.ts'
import { adminRouter } from './routes/admin.ts'
import { miscRouter } from './routes/misc.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 8787)
const ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

mkdirSync(join(__dirname, '../data'), { recursive: true })
migrate()
if (!getMeta('generatedAt')) {
  console.log('🌱 پایگاه داده خالی است — بارگذاری دیتاست اولیه…')
  await seed()
}

const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: ORIGIN.split(','), credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }),
  authRouter,
)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, generatedAt: getMeta('generatedAt'), time: new Date().toISOString() })
})

// فهرست عمومی شرکت‌ها برای فرم ثبت‌نام (بدون احراز هویت)
app.get('/api/public/companies', (_req, res) => {
  res.json(
    listEntities<{ id: string; name: string }>('companies').map((c) => ({ id: c.id, name: c.name })),
  )
})

app.use('/api', datasetRouter)
app.use('/api', miscRouter)
app.use('/api/company', companyRouter)
app.use('/api/contracts', contractsRouter)
app.use('/api/mentor', mentorRouter)
app.use('/api/investor', investorRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/admin', adminRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'مسیر یافت نشد' })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'خطای داخلی سرور' })
})

const server = app.listen(PORT, () => {
  console.log(`🚀 سرور OIPMS روی http://localhost:${PORT} — CORS: ${ORIGIN}`)
})

process.on('SIGINT', () => {
  server.close()
  db.close()
  process.exit(0)
})
