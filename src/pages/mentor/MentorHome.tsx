import { useState } from 'react'
import { GraduationCap, Users, CheckCircle2, NotebookPen } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge, ProgressBar } from '@/components/ui'
import { jDateShort, pct, nf } from '@/lib/format'
import type { MentoringEngagement } from '@/lib/types'

interface Session {
  id: string
  engagementId: string
  date: string
  durationMinutes: number
  notes: string
  createdAt: string
}

export default function MentorHome() {
  const mentees = useApi<MentoringEngagement[]>('/api/mentor/mentees')
  const sessions = useApi<Session[]>('/api/mentor/sessions')
  const [edit, setEdit] = useState<MentoringEngagement | null>(null)
  const [log, setLog] = useState<MentoringEngagement | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  if (mentees.loading) return <LoadingState />
  if (mentees.error) return <ErrorState error={mentees.error} />

  const rows = mentees.data ?? []
  const active = rows.filter((m) => m.status === 'در حال انجام').length
  const done = rows.filter((m) => m.status === 'تکمیل‌شده').length
  const avg = rows.length ? rows.reduce((s, m) => s + m.progressPercent, 0) / rows.length : 0
  const sessionsByEng = new Map<string, number>()
  for (const s of sessions.data ?? []) sessionsByEng.set(s.engagementId, (sessionsByEng.get(s.engagementId) ?? 0) + 1)

  return (
    <div>
      <PageHeader title="میز منتورینگ" subtitle="پیگیری شرکت‌های تحت پوشش، ثبت جلسات و به‌روزرسانی پیشرفت" />

      {msg && <div className="mb-4 rounded-xl bg-petro-600/10 px-4 py-3 text-sm text-petro-700 dark:text-petro-300">{msg}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="شرکت‌های تحت پوشش" value={rows.length} icon={Users} />
        <Kpi label="در حال انجام" value={active} icon={GraduationCap} tone="brand" />
        <Kpi label="تکمیل‌شده" value={done} icon={CheckCircle2} tone="gold" />
        <Kpi label="میانگین پیشرفت" value={pct(avg)} icon={NotebookPen} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {rows.map((m) => (
          <Card key={m.id} title={<span>{m.companyName} — {m.area}</span>}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <Badge tone={m.status === 'تکمیل‌شده' ? 'green' : m.status === 'متوقف' ? 'red' : 'blue'}>{m.status}</Badge>
              <span className="fa-nums text-[rgb(var(--muted))]">جلسه بعدی: {jDateShort(m.nextSession)}</span>
            </div>
            <ProgressBar value={m.progressPercent} />
            <p className="fa-nums mt-1 text-xs text-[rgb(var(--muted))]">
              پیشرفت {pct(m.progressPercent, 0)} · {nf(sessionsByEng.get(m.id) ?? 0)} جلسه ثبت‌شده
            </p>
            <div className="mt-3 flex gap-2">
              <button className="btn !text-xs" onClick={() => setEdit(m)}>
                به‌روزرسانی پیشرفت
              </button>
              <button className="btn !text-xs" onClick={() => setLog(m)}>
                <NotebookPen className="h-3.5 w-3.5" /> ثبت جلسه
              </button>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">شرکتی به شما تخصیص داده نشده است.</p>}
      </div>

      {edit && (
        <ProgressModal
          engagement={edit}
          onClose={() => setEdit(null)}
          onDone={(t) => {
            setMsg(t)
            setEdit(null)
            mentees.reload()
          }}
        />
      )}
      {log && (
        <SessionModal
          engagement={log}
          onClose={() => setLog(null)}
          onDone={(t) => {
            setMsg(t)
            setLog(null)
            sessions.reload()
            mentees.reload()
          }}
        />
      )}
    </div>
  )
}

function ProgressModal({
  engagement,
  onClose,
  onDone,
}: {
  engagement: MentoringEngagement
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const [progress, setProgress] = useState(engagement.progressPercent)
  const [status, setStatus] = useState(engagement.status)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.patch(`/api/mentor/mentees/${engagement.id}`, { progressPercent: Number(progress), status })
      onDone('پیشرفت به‌روزرسانی شد.')
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'خطا')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} title={`پیشرفت — ${engagement.companyName}`}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-[rgb(var(--muted))]">درصد پیشرفت: {progress.toLocaleString('fa-IR')}٪</span>
          <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(+e.target.value)} className="w-full" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[rgb(var(--muted))]">وضعیت</span>
          <select className="inp" value={status} onChange={(e) => setStatus(e.target.value as MentoringEngagement['status'])}>
            {(['در حال انجام', 'تکمیل‌شده', 'برنامه‌ریزی‌شده', 'متوقف'] as const).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {err && <p className="text-sm text-oil-rust">{err}</p>}
        <button className="btn btn-primary w-full justify-center" disabled={busy}>ثبت</button>
      </form>
    </Modal>
  )
}

function SessionModal({
  engagement,
  onClose,
  onDone,
}: {
  engagement: MentoringEngagement
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/api/mentor/sessions', {
        engagementId: engagement.id,
        date,
        durationMinutes: Number(duration),
        notes,
      })
      onDone('جلسه منتورینگ ثبت شد.')
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'خطا')
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} title={`ثبت جلسه — ${engagement.companyName}`}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-[rgb(var(--muted))]">تاریخ جلسه (میلادی)</span>
          <input type="date" required className="inp" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[rgb(var(--muted))]">مدت (دقیقه)</span>
          <input type="number" min={15} max={480} step={15} className="inp" value={duration} onChange={(e) => setDuration(+e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[rgb(var(--muted))]">شرح و مصوبات جلسه</span>
          <textarea required rows={4} className="inp" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {err && <p className="text-sm text-oil-rust">{err}</p>}
        <button className="btn btn-primary w-full justify-center" disabled={busy}>ثبت جلسه</button>
      </form>
    </Modal>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[rgb(var(--surface))] p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  )
}
