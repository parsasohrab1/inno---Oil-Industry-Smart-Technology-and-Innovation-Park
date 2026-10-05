import { useState } from 'react'
import clsx from 'clsx'
import { Building2, Coins, GraduationCap, Wallet, Plus } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { DataTable, type Column } from '@/components/DataTable'
import { rial, nf, jDateShort, jDateTime, pct } from '@/lib/format'
import type {
  Company,
  FundingRequest,
  MeetingBooking,
  MentoringEngagement,
  RentalInvoice,
} from '@/lib/types'

type Tab = 'overview' | 'invoices' | 'bookings' | 'funding' | 'mentoring'

export default function CompanyHome() {
  const [tab, setTab] = useState<Tab>('overview')
  const company = useApi<Company>('/api/company/me')
  const invoices = useApi<RentalInvoice[]>('/api/company/invoices')
  const bookings = useApi<MeetingBooking[]>('/api/company/bookings')
  const funding = useApi<FundingRequest[]>('/api/company/funding')
  const mentoring = useApi<MentoringEngagement[]>('/api/company/mentoring')
  const [msg, setMsg] = useState<string | null>(null)

  if (company.loading) return <LoadingState />
  if (company.error) return <ErrorState error={company.error} />
  const c = company.data
  if (!c) return null

  const inv = invoices.data ?? []
  const outstanding = inv
    .filter((i) => i.status !== 'Paid')
    .reduce((s, i) => s + i.totalRent + i.penalty, 0)
  const overdue = inv.filter((i) => i.status === 'Overdue')
  const gateBlocked = overdue.some((i) => i.gateAccessRevoked)

  async function pay(id: string) {
    setMsg(null)
    try {
      await api.post(`/api/company/invoices/${id}/pay`)
      setMsg('Payment was recorded successfully. If the debt is fully cleared, gate access will be activated.')
      invoices.reload()
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Payment error')
    }
  }

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'invoices', label: `Invoices (${inv.length})` },
    { id: 'bookings', label: `Meeting bookings (${bookings.data?.length ?? 0})` },
    { id: 'funding', label: `Financing (${funding.data?.length ?? 0})` },
    { id: 'mentoring', label: `Mentoring (${mentoring.data?.length ?? 0})` },
  ]

  return (
    <div>
      <PageHeader title={`${c.name} panel`} subtitle="Resident company desk — invoices, contract, booking and mentoring" />

      {gateBlocked && (
        <div className="mb-4 rounded-xl border border-oil-rust/30 bg-oil-rust/10 px-4 py-3 text-sm text-oil-rust">
          ⚠️ Due to overdue debt of 2 months or more, vehicle gate access and face recognition of this company's employees is disabled.
          To lift the restriction, pay the overdue invoices.
        </div>
      )}
      {msg && <div className="mb-4 rounded-xl bg-petro-600/10 px-4 py-3 text-sm text-petro-700 dark:text-petro-300">{msg}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Leased area" value={c.areaM2} unit="square meters" icon={Building2} />
        <Kpi label="Current debt" value={rial(outstanding)} icon={Wallet} tone={outstanding > 0 ? 'rust' : 'brand'} />
        <Kpi label="Overdue invoices" value={overdue.length} icon={Coins} tone={overdue.length ? 'rust' : 'neutral'} />
        <Kpi label="Active mentoring" value={(mentoring.data ?? []).filter((m) => m.status === 'In progress').length} icon={GraduationCap} />
      </div>

      <div className="my-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'rounded-xl border px-3 py-1.5 text-sm',
              tab === t.id ? 'border-transparent bg-petro-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Company profile">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Info k="Field of activity" v={c.field} />
              <Info k="Number of employees" v={nf(c.employeeCount)} />
              <Info k="Technology maturity level" v={`${nf(c.maturityLevel)} of 5`} />
              <Info k="Rent rate per meter" v={rial(c.rentalRatePerM2)} />
              <Info k="Knowledge-based" v={c.isKnowledgeBased ? 'Yes' : 'No'} />
              <Info k="Patent" v={c.hasPatent ? 'Yes' : 'None'} />
              <Info k="Establishment date" v={jDateShort(c.establishmentDate)} />
            </dl>
          </Card>
          <Card title="Quick actions">
            <div className="space-y-2 text-sm">
              <p className="text-[rgb(var(--muted))]">Use the tabs above to pay invoices, book a meeting room, submit a financing request and track mentoring.</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'invoices' && (
        <Card title="Rent invoices">
          <InvoiceTable rows={inv} onPay={pay} />
        </Card>
      )}

      {tab === 'bookings' && (
        <BookingsPanel rows={bookings.data ?? []} reload={bookings.reload} setMsg={setMsg} />
      )}

      {tab === 'funding' && <FundingPanel rows={funding.data ?? []} reload={funding.reload} setMsg={setMsg} />}

      {tab === 'mentoring' && (
        <Card title="Company mentoring paths">
          <MentoringTable rows={mentoring.data ?? []} />
        </Card>
      )}
    </div>
  )
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[rgb(var(--muted))]">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  )
}

const INV_LABEL = { Paid: 'Paid', Overdue: 'Overdue', Pending: 'Pending' } as const
const INV_TONE = { Paid: 'green', Overdue: 'red', Pending: 'amber' } as const

function InvoiceTable({ rows, onPay }: { rows: RentalInvoice[]; onPay: (id: string) => void }) {
  const cols: Column<RentalInvoice>[] = [
    { key: 'period', header: 'Period', align: 'center' },
    {
      key: 'totalRent',
      header: 'Amount',
      align: 'end',
      sortValue: (r) => r.totalRent,
      render: (r) => <span className="fa-nums">{rial(r.totalRent)}</span>,
    },
    {
      key: 'penalty',
      header: 'Penalty',
      align: 'end',
      render: (r) => <span className="fa-nums">{r.penalty ? rial(r.penalty) : '—'}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due date',
      align: 'center',
      sortValue: (r) => r.dueDate,
      render: (r) => <span className="fa-nums">{jDateShort(r.dueDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={INV_TONE[r.status]}>{INV_LABEL[r.status]}</Badge>,
    },
    {
      key: 'act',
      header: '',
      align: 'center',
      render: (r) =>
        r.status === 'Paid' ? (
          <span className="text-xs text-[rgb(var(--muted))]">—</span>
        ) : (
          <button className="btn btn-primary !py-1 !text-xs" onClick={() => onPay(r.id)}>
            Pay
          </button>
        ),
    },
  ]
  return <DataTable columns={cols} rows={rows} pageSize={12} initialSort={{ key: 'dueDate', dir: 'desc' }} />
}

function MentoringTable({ rows }: { rows: MentoringEngagement[] }) {
  const cols: Column<MentoringEngagement>[] = [
    { key: 'area', header: 'Area', sortValue: (r) => r.area },
    { key: 'mentorName', header: 'Mentor', sortValue: (r) => r.mentorName },
    {
      key: 'progressPercent',
      header: 'Progress',
      align: 'center',
      sortValue: (r) => r.progressPercent,
      render: (r) => <span className="fa-nums">{pct(r.progressPercent, 0)}</span>,
    },
    {
      key: 'nextSession',
      header: 'Next session',
      align: 'center',
      render: (r) => <span className="fa-nums">{jDateShort(r.nextSession)}</span>,
    },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone="blue">{r.status}</Badge> },
  ]
  return <DataTable columns={cols} rows={rows} pageSize={10} />
}

const ROOMS = ['Ferdowsi', 'Saadi', 'Hafez', 'Molavi', 'Khayyam', 'Nezami', 'Attar', 'Sanai']

function BookingsPanel({
  rows,
  reload,
  setMsg,
}: {
  rows: MeetingBooking[]
  reload: () => void
  setMsg: (m: string) => void
}) {
  const [form, setForm] = useState({ roomName: ROOMS[0], date: '', time: '09:00', durationMinutes: 60, participantCount: 4 })
  const [busy, setBusy] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const startTime = new Date(`${form.date}T${form.time}:00`).toISOString()
      await api.post('/api/company/bookings', {
        roomName: form.roomName,
        startTime,
        durationMinutes: Number(form.durationMinutes),
        participantCount: Number(form.participantCount),
      })
      setMsg('Booking was recorded successfully.')
      reload()
    } catch (e2) {
      setMsg(e2 instanceof ApiError ? e2.message : 'Error recording the booking')
    } finally {
      setBusy(false)
    }
  }

  async function cancel(id: string) {
    try {
      await api.post(`/api/company/bookings/${id}/cancel`)
      setMsg('Booking cancelled.')
      reload()
    } catch {
      setMsg('Error cancelling the booking')
    }
  }

  const cols: Column<MeetingBooking>[] = [
    { key: 'roomName', header: 'Room', sortValue: (r) => r.roomName },
    {
      key: 'startTime',
      header: 'Time',
      align: 'center',
      sortValue: (r) => r.startTime,
      render: (r) => <span className="fa-nums">{jDateTime(r.startTime)}</span>,
    },
    { key: 'durationMinutes', header: 'Duration', align: 'center', render: (r) => <span className="fa-nums">{nf(r.durationMinutes)} minutes</span> },
    { key: 'status', header: 'Status', align: 'center', render: (r) => <Badge tone={r.status === 'Cancelled' ? 'red' : 'blue'}>{r.status === 'Cancelled' ? 'Cancelled' : r.status === 'Completed' ? 'Held' : 'Confirmed'}</Badge> },
    {
      key: 'act',
      header: '',
      align: 'center',
      render: (r) =>
        r.status === 'Confirmed' ? (
          <button className="btn !py-1 !text-xs" onClick={() => cancel(r.id)}>
            Cancel
          </button>
        ) : null,
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Book a new room" className="lg:col-span-1">
        <form onSubmit={create} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">Room</span>
            <select className="inp" value={form.roomName} onChange={(e) => setForm({ ...form, roomName: e.target.value })}>
              {ROOMS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">Date (Gregorian)</span>
            <input type="date" required className="inp" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              <span className="mb-1 block text-[rgb(var(--muted))]">Time</span>
              <input type="time" required className="inp" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[rgb(var(--muted))]">Duration (minutes)</span>
              <input type="number" min={15} max={480} step={15} className="inp" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">Number of participants</span>
            <input type="number" min={1} max={200} className="inp" value={form.participantCount} onChange={(e) => setForm({ ...form, participantCount: +e.target.value })} />
          </label>
          <button className="btn btn-primary w-full justify-center" disabled={busy}>
            <Plus className="h-4 w-4" /> Record booking
          </button>
        </form>
      </Card>
      <Card title="Company bookings" className="lg:col-span-2">
        <DataTable columns={cols} rows={rows} pageSize={10} initialSort={{ key: 'startTime', dir: 'desc' }} />
      </Card>
    </div>
  )
}

const FUNDS = [
  'Ministry of Petroleum Research and Technology Fund',
  'Innovation and Prosperity Fund',
  'National Development Fund — Oil Sector',
  'Parsian Venture Fund',
  'Oil Industry Angel Investors',
]

function FundingPanel({
  rows,
  reload,
  setMsg,
}: {
  rows: FundingRequest[]
  reload: () => void
  setMsg: (m: string) => void
}) {
  const [form, setForm] = useState({ fund: FUNDS[0], amount: 5_000_000_000 })
  const [busy, setBusy] = useState(false)

  async function apply(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/api/company/funding', { fund: form.fund, amountRequestedRial: Number(form.amount) })
      setMsg('The financing request was recorded and placed in the review queue.')
      reload()
    } catch (e2) {
      setMsg(e2 instanceof ApiError ? e2.message : 'Error recording the request')
    } finally {
      setBusy(false)
    }
  }

  const cols: Column<FundingRequest>[] = [
    { key: 'fund', header: 'Fund', sortValue: (r) => r.fund },
    {
      key: 'amountRequestedRial',
      header: 'Requested amount',
      align: 'end',
      sortValue: (r) => r.amountRequestedRial,
      render: (r) => <span className="fa-nums">{rial(r.amountRequestedRial)}</span>,
    },
    { key: 'stage', header: 'Stage', align: 'center', render: (r) => <Badge tone="blue">{r.stage}</Badge> },
    {
      key: 'successProbability',
      header: 'Success probability',
      align: 'center',
      render: (r) => <span className="fa-nums">{pct(r.successProbability, 0)}</span>,
    },
    {
      key: 'submittedDate',
      header: 'Registration date',
      align: 'center',
      render: (r) => <span className="fa-nums">{jDateShort(r.submittedDate)}</span>,
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="New financing request">
        <form onSubmit={apply} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">Target fund</span>
            <select className="inp" value={form.fund} onChange={(e) => setForm({ ...form, fund: e.target.value })}>
              {FUNDS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">Amount (rials)</span>
            <input type="number" min={100_000_000} step={100_000_000} className="inp fa-nums" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
          </label>
          <button className="btn btn-primary w-full justify-center" disabled={busy}>
            <Plus className="h-4 w-4" /> Record request
          </button>
        </form>
      </Card>
      <Card title="Company financing requests" className="lg:col-span-2">
        <DataTable columns={cols} rows={rows} pageSize={10} initialSort={{ key: 'submittedDate', dir: 'desc' }} />
      </Card>
    </div>
  )
}
