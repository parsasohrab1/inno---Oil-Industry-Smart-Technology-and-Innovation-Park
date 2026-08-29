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
      setMsg('پرداخت با موفقیت ثبت شد. در صورت رفع کامل بدهی، دسترسی گیت فعال می‌شود.')
      invoices.reload()
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'خطا در پرداخت')
    }
  }

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'نمای کلی' },
    { id: 'invoices', label: `صورتحساب‌ها (${inv.length})` },
    { id: 'bookings', label: `رزرو جلسات (${bookings.data?.length ?? 0})` },
    { id: 'funding', label: `تأمین مالی (${funding.data?.length ?? 0})` },
    { id: 'mentoring', label: `منتورینگ (${mentoring.data?.length ?? 0})` },
  ]

  return (
    <div>
      <PageHeader title={`پنل ${c.name}`} subtitle="میز کار شرکت مستقر — صورتحساب، قرارداد، رزرو و منتورینگ" />

      {gateBlocked && (
        <div className="mb-4 rounded-xl border border-oil-rust/30 bg-oil-rust/10 px-4 py-3 text-sm text-oil-rust">
          ⚠️ به دلیل بدهی معوق ۲ ماه یا بیشتر، دسترسی گیت خودرو و تشخیص چهره کارکنان این شرکت غیرفعال است.
          برای رفع محدودیت، صورتحساب‌های معوق را پرداخت کنید.
        </div>
      )}
      {msg && <div className="mb-4 rounded-xl bg-petro-600/10 px-4 py-3 text-sm text-petro-700 dark:text-petro-300">{msg}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="متراژ اجاره‌ای" value={c.areaM2} unit="متر مربع" icon={Building2} />
        <Kpi label="بدهی جاری" value={rial(outstanding)} icon={Wallet} tone={outstanding > 0 ? 'rust' : 'brand'} />
        <Kpi label="صورتحساب معوق" value={overdue.length} icon={Coins} tone={overdue.length ? 'rust' : 'neutral'} />
        <Kpi label="منتورینگ فعال" value={(mentoring.data ?? []).filter((m) => m.status === 'در حال انجام').length} icon={GraduationCap} />
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
          <Card title="مشخصات شرکت">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Info k="حوزه فعالیت" v={c.field} />
              <Info k="تعداد کارکنان" v={nf(c.employeeCount)} />
              <Info k="سطح بلوغ فناوری" v={`${nf(c.maturityLevel)} از ۵`} />
              <Info k="نرخ اجاره هر متر" v={rial(c.rentalRatePerM2)} />
              <Info k="دانش‌بنیان" v={c.isKnowledgeBased ? 'بله' : 'خیر'} />
              <Info k="ثبت اختراع" v={c.hasPatent ? 'دارد' : 'ندارد'} />
              <Info k="تاریخ تأسیس" v={jDateShort(c.establishmentDate)} />
            </dl>
          </Card>
          <Card title="اقدامات سریع">
            <div className="space-y-2 text-sm">
              <p className="text-[rgb(var(--muted))]">از تب‌های بالا برای پرداخت صورتحساب، رزرو اتاق جلسه، ثبت درخواست تأمین مالی و پیگیری منتورینگ استفاده کنید.</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'invoices' && (
        <Card title="صورتحساب‌های اجاره‌بها">
          <InvoiceTable rows={inv} onPay={pay} />
        </Card>
      )}

      {tab === 'bookings' && (
        <BookingsPanel rows={bookings.data ?? []} reload={bookings.reload} setMsg={setMsg} />
      )}

      {tab === 'funding' && <FundingPanel rows={funding.data ?? []} reload={funding.reload} setMsg={setMsg} />}

      {tab === 'mentoring' && (
        <Card title="مسیرهای منتورینگ شرکت">
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

const INV_LABEL = { Paid: 'پرداخت‌شده', Overdue: 'معوق', Pending: 'در انتظار' } as const
const INV_TONE = { Paid: 'green', Overdue: 'red', Pending: 'amber' } as const

function InvoiceTable({ rows, onPay }: { rows: RentalInvoice[]; onPay: (id: string) => void }) {
  const cols: Column<RentalInvoice>[] = [
    { key: 'period', header: 'دوره', align: 'center' },
    {
      key: 'totalRent',
      header: 'مبلغ',
      align: 'end',
      sortValue: (r) => r.totalRent,
      render: (r) => <span className="fa-nums">{rial(r.totalRent)}</span>,
    },
    {
      key: 'penalty',
      header: 'جریمه',
      align: 'end',
      render: (r) => <span className="fa-nums">{r.penalty ? rial(r.penalty) : '—'}</span>,
    },
    {
      key: 'dueDate',
      header: 'سررسید',
      align: 'center',
      sortValue: (r) => r.dueDate,
      render: (r) => <span className="fa-nums">{jDateShort(r.dueDate)}</span>,
    },
    {
      key: 'status',
      header: 'وضعیت',
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
            پرداخت
          </button>
        ),
    },
  ]
  return <DataTable columns={cols} rows={rows} pageSize={12} initialSort={{ key: 'dueDate', dir: 'desc' }} />
}

function MentoringTable({ rows }: { rows: MentoringEngagement[] }) {
  const cols: Column<MentoringEngagement>[] = [
    { key: 'area', header: 'حوزه', sortValue: (r) => r.area },
    { key: 'mentorName', header: 'منتور', sortValue: (r) => r.mentorName },
    {
      key: 'progressPercent',
      header: 'پیشرفت',
      align: 'center',
      sortValue: (r) => r.progressPercent,
      render: (r) => <span className="fa-nums">{pct(r.progressPercent, 0)}</span>,
    },
    {
      key: 'nextSession',
      header: 'جلسه بعدی',
      align: 'center',
      render: (r) => <span className="fa-nums">{jDateShort(r.nextSession)}</span>,
    },
    { key: 'status', header: 'وضعیت', align: 'center', render: (r) => <Badge tone="blue">{r.status}</Badge> },
  ]
  return <DataTable columns={cols} rows={rows} pageSize={10} />
}

const ROOMS = ['فردوسی', 'سعدی', 'حافظ', 'مولوی', 'خیام', 'نظامی', 'عطار', 'سنایی']

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
      setMsg('رزرو با موفقیت ثبت شد.')
      reload()
    } catch (e2) {
      setMsg(e2 instanceof ApiError ? e2.message : 'خطا در ثبت رزرو')
    } finally {
      setBusy(false)
    }
  }

  async function cancel(id: string) {
    try {
      await api.post(`/api/company/bookings/${id}/cancel`)
      setMsg('رزرو لغو شد.')
      reload()
    } catch {
      setMsg('خطا در لغو رزرو')
    }
  }

  const cols: Column<MeetingBooking>[] = [
    { key: 'roomName', header: 'اتاق', sortValue: (r) => r.roomName },
    {
      key: 'startTime',
      header: 'زمان',
      align: 'center',
      sortValue: (r) => r.startTime,
      render: (r) => <span className="fa-nums">{jDateTime(r.startTime)}</span>,
    },
    { key: 'durationMinutes', header: 'مدت', align: 'center', render: (r) => <span className="fa-nums">{nf(r.durationMinutes)} دقیقه</span> },
    { key: 'status', header: 'وضعیت', align: 'center', render: (r) => <Badge tone={r.status === 'Cancelled' ? 'red' : 'blue'}>{r.status === 'Cancelled' ? 'لغوشده' : r.status === 'Completed' ? 'برگزارشده' : 'تأییدشده'}</Badge> },
    {
      key: 'act',
      header: '',
      align: 'center',
      render: (r) =>
        r.status === 'Confirmed' ? (
          <button className="btn !py-1 !text-xs" onClick={() => cancel(r.id)}>
            لغو
          </button>
        ) : null,
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="رزرو اتاق جدید" className="lg:col-span-1">
        <form onSubmit={create} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">اتاق</span>
            <select className="inp" value={form.roomName} onChange={(e) => setForm({ ...form, roomName: e.target.value })}>
              {ROOMS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">تاریخ (میلادی)</span>
            <input type="date" required className="inp" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              <span className="mb-1 block text-[rgb(var(--muted))]">ساعت</span>
              <input type="time" required className="inp" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[rgb(var(--muted))]">مدت (دقیقه)</span>
              <input type="number" min={15} max={480} step={15} className="inp" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">تعداد شرکت‌کننده</span>
            <input type="number" min={1} max={200} className="inp" value={form.participantCount} onChange={(e) => setForm({ ...form, participantCount: +e.target.value })} />
          </label>
          <button className="btn btn-primary w-full justify-center" disabled={busy}>
            <Plus className="h-4 w-4" /> ثبت رزرو
          </button>
        </form>
      </Card>
      <Card title="رزروهای شرکت" className="lg:col-span-2">
        <DataTable columns={cols} rows={rows} pageSize={10} initialSort={{ key: 'startTime', dir: 'desc' }} />
      </Card>
    </div>
  )
}

const FUNDS = [
  'صندوق پژوهش و فناوری وزارت نفت',
  'صندوق نوآوری و شکوفایی',
  'صندوق توسعه ملی — بخش نفت',
  'صندوق خطرپذیر پارسیان',
  'سرمایه‌گذاران فرشته صنعت نفت',
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
      setMsg('درخواست تأمین مالی ثبت شد و در صف بررسی قرار گرفت.')
      reload()
    } catch (e2) {
      setMsg(e2 instanceof ApiError ? e2.message : 'خطا در ثبت درخواست')
    } finally {
      setBusy(false)
    }
  }

  const cols: Column<FundingRequest>[] = [
    { key: 'fund', header: 'صندوق', sortValue: (r) => r.fund },
    {
      key: 'amountRequestedRial',
      header: 'مبلغ درخواستی',
      align: 'end',
      sortValue: (r) => r.amountRequestedRial,
      render: (r) => <span className="fa-nums">{rial(r.amountRequestedRial)}</span>,
    },
    { key: 'stage', header: 'مرحله', align: 'center', render: (r) => <Badge tone="blue">{r.stage}</Badge> },
    {
      key: 'successProbability',
      header: 'احتمال موفقیت',
      align: 'center',
      render: (r) => <span className="fa-nums">{pct(r.successProbability, 0)}</span>,
    },
    {
      key: 'submittedDate',
      header: 'تاریخ ثبت',
      align: 'center',
      render: (r) => <span className="fa-nums">{jDateShort(r.submittedDate)}</span>,
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="درخواست تأمین مالی جدید">
        <form onSubmit={apply} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">صندوق هدف</span>
            <select className="inp" value={form.fund} onChange={(e) => setForm({ ...form, fund: e.target.value })}>
              {FUNDS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[rgb(var(--muted))]">مبلغ (ریال)</span>
            <input type="number" min={100_000_000} step={100_000_000} className="inp fa-nums" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
          </label>
          <button className="btn btn-primary w-full justify-center" disabled={busy}>
            <Plus className="h-4 w-4" /> ثبت درخواست
          </button>
        </form>
      </Card>
      <Card title="درخواست‌های تأمین مالی شرکت" className="lg:col-span-2">
        <DataTable columns={cols} rows={rows} pageSize={10} initialSort={{ key: 'submittedDate', dir: 'desc' }} />
      </Card>
    </div>
  )
}
