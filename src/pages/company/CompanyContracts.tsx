import { useState } from 'react'
import { ScrollText, PenLine } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Card, Badge } from '@/components/ui'
import { rial, jDateShort, jDateTime } from '@/lib/format'

interface Signature {
  party: 'park' | 'tenant'
  signerName: string
  signedAt: string
}
interface Contract {
  id: string
  companyName: string
  title: string
  areaM2: number
  monthlyRent: number
  startDate: string
  endDate: string
  autoRenew: boolean
  penaltyRatePerMonth: number
  state: 'draft' | 'pending_signatures' | 'active' | 'expired' | 'terminated'
  signatures: Signature[]
  updatedAt: string
}

const STATE_LABEL: Record<Contract['state'], string> = {
  draft: 'پیش‌نویس',
  pending_signatures: 'در انتظار امضا',
  active: 'فعال',
  expired: 'منقضی‌شده',
  terminated: 'فسخ‌شده',
}
const STATE_TONE: Record<Contract['state'], 'gray' | 'amber' | 'green' | 'red'> = {
  draft: 'gray',
  pending_signatures: 'amber',
  active: 'green',
  expired: 'red',
  terminated: 'red',
}

export default function CompanyContracts() {
  const { data, loading, error, reload } = useApi<Contract[]>('/api/company/contracts')
  const [msg, setMsg] = useState<string | null>(null)
  const [signName, setSignName] = useState('')

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  async function sign(id: string) {
    if (!signName.trim()) {
      setMsg('لطفاً نام امضاکننده را وارد کنید')
      return
    }
    try {
      await api.post(`/api/company/contracts/${id}/sign`, { signerName: signName })
      setMsg('امضای دیجیتال شما ثبت شد و در دفتر تغییرناپذیر قرارداد درج گردید.')
      reload()
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'خطا در امضا')
    }
  }

  return (
    <div>
      <PageHeader
        title="قراردادهای من"
        subtitle="قرارداد اجاره هوشمند — امضای دیجیتال، شرایط و دفتر رویداد تغییرناپذیر"
      />
      {msg && <div className="mb-4 rounded-xl bg-petro-600/10 px-4 py-3 text-sm text-petro-700 dark:text-petro-300">{msg}</div>}

      <div className="mb-4 max-w-sm">
        <label className="block text-sm">
          <span className="mb-1 block text-[rgb(var(--muted))]">نام امضاکننده (برای امضای قرارداد)</span>
          <input className="inp" value={signName} onChange={(e) => setSignName(e.target.value)} placeholder="نام و سمت" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(data ?? []).map((c) => {
          const tenantSigned = c.signatures.some((s) => s.party === 'tenant')
          const parkSigned = c.signatures.some((s) => s.party === 'park')
          return (
            <Card key={c.id} title={<span className="flex items-center gap-2"><ScrollText className="h-4 w-4" />{c.id}</span>}>
              <p className="text-sm font-medium">{c.title}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-[rgb(var(--muted))]">اجاره ماهانه</dt><dd className="fa-nums font-medium">{rial(c.monthlyRent)}</dd></div>
                <div><dt className="text-[rgb(var(--muted))]">متراژ</dt><dd className="fa-nums font-medium">{c.areaM2} م²</dd></div>
                <div><dt className="text-[rgb(var(--muted))]">شروع</dt><dd className="fa-nums">{jDateShort(c.startDate)}</dd></div>
                <div><dt className="text-[rgb(var(--muted))]">پایان</dt><dd className="fa-nums">{jDateShort(c.endDate)}</dd></div>
                <div><dt className="text-[rgb(var(--muted))]">تمدید خودکار</dt><dd>{c.autoRenew ? 'بله' : 'خیر'}</dd></div>
                <div><dt className="text-[rgb(var(--muted))]">نرخ جریمه ماهانه</dt><dd className="fa-nums">{(c.penaltyRatePerMonth * 100).toLocaleString('fa-IR')}٪</dd></div>
              </dl>

              <div className="mt-3 flex items-center gap-2">
                <Badge tone={STATE_TONE[c.state]}>{STATE_LABEL[c.state]}</Badge>
                <Badge tone={parkSigned ? 'green' : 'gray'}>{parkSigned ? 'امضای پارک ✓' : 'بدون امضای پارک'}</Badge>
                <Badge tone={tenantSigned ? 'green' : 'gray'}>{tenantSigned ? 'امضای شرکت ✓' : 'بدون امضای شرکت'}</Badge>
              </div>

              {c.signatures.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-[rgb(var(--muted))]">
                  {c.signatures.map((s, i) => (
                    <li key={i} className="fa-nums">
                      {s.party === 'park' ? 'پارک' : 'شرکت'}: {s.signerName} — {jDateTime(s.signedAt)}
                    </li>
                  ))}
                </ul>
              )}

              {!tenantSigned && (c.state === 'pending_signatures' || c.state === 'draft') && (
                <button className="btn btn-primary mt-4 !text-sm" onClick={() => sign(c.id)}>
                  <PenLine className="h-4 w-4" /> امضای دیجیتال قرارداد
                </button>
              )}
            </Card>
          )
        })}
        {(data ?? []).length === 0 && (
          <p className="text-sm text-[rgb(var(--muted))]">قراردادی برای شرکت شما ثبت نشده است.</p>
        )}
      </div>
    </div>
  )
}
