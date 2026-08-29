import { useState } from 'react'
import { ScrollText, ShieldCheck, ShieldAlert, Play, PenLine, X } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { DataTable, type Column } from '@/components/DataTable'
import { rial, jDateShort, jDateTime } from '@/lib/format'

interface Contract {
  id: string
  companyId: string
  companyName: string
  title: string
  areaM2: number
  monthlyRent: number
  startDate: string
  endDate: string
  autoRenew: boolean
  state: 'draft' | 'pending_signatures' | 'active' | 'expired' | 'terminated'
  signatures: Array<{ party: 'park' | 'tenant'; signerName: string; signedAt: string }>
}
interface ContractEvent {
  seq: number
  type: string
  payload: Record<string, unknown>
  actor: string
  createdAt: string
  hash: string
}
interface ContractDetail {
  contract: Contract
  events: ContractEvent[]
  chain: { valid: boolean; brokenAtSeq?: number }
}

const STATE_LABEL: Record<Contract['state'], string> = {
  draft: 'پیش‌نویس',
  pending_signatures: 'در انتظار امضا',
  active: 'فعال',
  expired: 'منقضی',
  terminated: 'فسخ‌شده',
}
const STATE_TONE: Record<Contract['state'], 'gray' | 'amber' | 'green' | 'red'> = {
  draft: 'gray',
  pending_signatures: 'amber',
  active: 'green',
  expired: 'red',
  terminated: 'red',
}
const EVENT_LABEL: Record<string, string> = {
  created: 'ایجاد قرارداد',
  signed: 'امضا',
  activated: 'فعال‌سازی',
  penalty_applied: 'اعمال جریمه',
  renewed: 'تمدید خودکار',
  expired: 'انقضا',
  terminated: 'فسخ',
  gate_access_changed: 'تغییر دسترسی گیت',
}

export default function Contracts() {
  const { can } = useAuth()
  const { data, loading, error, reload } = useApi<Contract[]>('/api/contracts')
  const [openId, setOpenId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  const rows = data ?? []
  const active = rows.filter((c) => c.state === 'active').length
  const pending = rows.filter((c) => c.state === 'pending_signatures').length

  async function runAll() {
    setMsg(null)
    try {
      const r = await api.post<{ processed: number; touched: string[]; appliedEvents: number }>(
        '/api/contracts/run-conditions/all',
      )
      setMsg(`اجرای خودکار انجام شد: ${r.processed} قرارداد بررسی، ${r.appliedEvents} رویداد ثبت شد.`)
      reload()
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'خطا')
    }
  }

  const cols: Column<Contract>[] = [
    { key: 'id', header: 'شناسه', sortValue: (r) => r.id },
    { key: 'companyName', header: 'شرکت', sortValue: (r) => r.companyName },
    {
      key: 'monthlyRent',
      header: 'اجاره ماهانه',
      align: 'end',
      sortValue: (r) => r.monthlyRent,
      render: (r) => <span className="fa-nums">{rial(r.monthlyRent)}</span>,
    },
    {
      key: 'endDate',
      header: 'پایان',
      align: 'center',
      sortValue: (r) => r.endDate,
      render: (r) => <span className="fa-nums">{jDateShort(r.endDate)}</span>,
    },
    {
      key: 'state',
      header: 'وضعیت',
      align: 'center',
      sortValue: (r) => r.state,
      render: (r) => <Badge tone={STATE_TONE[r.state]}>{STATE_LABEL[r.state]}</Badge>,
    },
    {
      key: 'act',
      header: '',
      align: 'center',
      render: (r) => (
        <button className="text-xs text-petro-600 hover:underline" onClick={() => setOpenId(r.id)}>
          جزئیات
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="قراردادهای هوشمند"
        subtitle="امضای دیجیتال دوطرفه، دفتر رویداد تغییرناپذیر (زنجیره هش) و اجرای خودکار شرط‌ها"
        actions={
          can('contracts:run-conditions') && (
            <button className="btn btn-primary !text-sm" onClick={runAll}>
              <Play className="h-4 w-4" /> اجرای خودکار شرط‌ها
            </button>
          )
        }
      />
      {msg && <div className="mb-4 rounded-xl bg-petro-600/10 px-4 py-3 text-sm text-petro-700 dark:text-petro-300">{msg}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل قراردادها" value={rows.length} icon={ScrollText} />
        <Kpi label="فعال" value={active} icon={ShieldCheck} tone="brand" />
        <Kpi label="در انتظار امضا" value={pending} icon={ShieldAlert} tone="gold" />
        <Kpi
          label="مجموع اجاره ماهانه"
          value={rial(rows.filter((c) => c.state === 'active').reduce((s, c) => s + c.monthlyRent, 0))}
          icon={ScrollText}
        />
      </div>

      <div className="mt-4">
        <Card title="فهرست قراردادها">
          <DataTable columns={cols} rows={rows} pageSize={15} initialSort={{ key: 'state', dir: 'asc' }} />
        </Card>
      </div>

      {openId && <ContractDrawer id={openId} onClose={() => setOpenId(null)} onChange={reload} />}
    </div>
  )
}

function ContractDrawer({ id, onClose, onChange }: { id: string; onClose: () => void; onChange: () => void }) {
  const { can } = useAuth()
  const { data, loading, reload } = useApi<ContractDetail>(`/api/contracts/${id}`)
  const [msg, setMsg] = useState<string | null>(null)

  async function act(path: string, body?: Record<string, unknown>) {
    setMsg(null)
    try {
      await api.post(path, body)
      reload()
      onChange()
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'خطا')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl overflow-y-auto border-s bg-[rgb(var(--surface))] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{id}</h3>
          <button className="btn !p-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading || !data ? (
          <LoadingState />
        ) : (
          <>
            <p className="mt-2 text-sm">{data.contract.title}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={STATE_TONE[data.contract.state]}>{STATE_LABEL[data.contract.state]}</Badge>
              <Badge tone={data.chain.valid ? 'green' : 'red'}>
                {data.chain.valid ? 'زنجیره هش معتبر ✓' : `زنجیره از رویداد ${data.chain.brokenAtSeq} خراب است`}
              </Badge>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-[rgb(var(--muted))]">شرکت</dt><dd>{data.contract.companyName}</dd></div>
              <div><dt className="text-[rgb(var(--muted))]">اجاره ماهانه</dt><dd className="fa-nums">{rial(data.contract.monthlyRent)}</dd></div>
              <div><dt className="text-[rgb(var(--muted))]">شروع</dt><dd className="fa-nums">{jDateShort(data.contract.startDate)}</dd></div>
              <div><dt className="text-[rgb(var(--muted))]">پایان</dt><dd className="fa-nums">{jDateShort(data.contract.endDate)}</dd></div>
            </dl>

            {msg && <p className="mt-3 rounded-lg bg-oil-gold/15 px-3 py-2 text-sm text-oil-amber">{msg}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {can('contracts:sign:park') && !data.contract.signatures.some((s) => s.party === 'park') && (
                <button className="btn btn-primary !text-sm" onClick={() => act(`/api/contracts/${id}/sign`, {})}>
                  <PenLine className="h-4 w-4" /> امضای طرف پارک
                </button>
              )}
              {can('contracts:run-conditions') && (
                <button className="btn !text-sm" onClick={() => act(`/api/contracts/${id}/run-conditions`)}>
                  <Play className="h-4 w-4" /> اجرای شرط‌ها
                </button>
              )}
              {can('contracts:terminate') && data.contract.state === 'active' && (
                <button
                  className="btn !text-sm"
                  onClick={() => act(`/api/contracts/${id}/terminate`, { reason: 'فسخ توسط مدیر پارک' })}
                >
                  فسخ قرارداد
                </button>
              )}
            </div>

            <h4 className="mt-6 mb-2 text-sm font-bold">دفتر رویداد تغییرناپذیر ({data.events.length})</h4>
            <ol className="space-y-2">
              {data.events.map((e) => (
                <li key={e.seq} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      #{e.seq.toLocaleString('fa-IR')} — {EVENT_LABEL[e.type] ?? e.type}
                    </span>
                    <span className="fa-nums text-[rgb(var(--muted))]">{jDateTime(e.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-[rgb(var(--muted))]">عامل: {e.actor}</div>
                  {Object.keys(e.payload).length > 0 && (
                    <pre className="mt-1 overflow-x-auto rounded bg-black/5 p-2 text-[11px] dark:bg-white/5" dir="ltr">
                      {JSON.stringify(e.payload, null, 1)}
                    </pre>
                  )}
                  <div className="mt-1 truncate font-mono text-[10px] text-[rgb(var(--muted))]" dir="ltr" title={e.hash}>
                    hash: {e.hash}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  )
}
