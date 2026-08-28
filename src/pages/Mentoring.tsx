import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { GraduationCap, Users, CheckCircle2, CalendarClock } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge, ProgressBar } from '@/components/ui'
import { ChartFrame, Bars } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { mentoringByArea } from '@/services/analytics'
import { pct, nf, jDateShort } from '@/lib/format'
import { MENTORING_AREAS, type MentoringArea, type MentoringEngagement, type MentoringStatus } from '@/lib/types'

const STATUS_TONE: Record<MentoringStatus, 'green' | 'amber' | 'blue' | 'red'> = {
  'در حال انجام': 'blue',
  'تکمیل‌شده': 'green',
  'برنامه‌ریزی‌شده': 'amber',
  متوقف: 'red',
}

export default function Mentoring() {
  const { data, loading, error } = useDataset()
  const [tab, setTab] = useState<MentoringArea | 'همه'>('همه')

  const summary = useMemo(() => (data ? mentoringByArea(data) : []), [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const all = data.mentoring
  const filtered = tab === 'همه' ? all : all.filter((m) => m.area === tab)
  const active = filtered.filter((m) => m.status === 'در حال انجام').length
  const completed = filtered.filter((m) => m.status === 'تکمیل‌شده').length
  const avgProgress = filtered.reduce((s, m) => s + m.progressPercent, 0) / (filtered.length || 1)

  const chart = summary.map((s) => ({
    area: s.area,
    فعال: s.active,
    تکمیل‌شده: s.completed,
    'برنامه‌ریزی/متوقف': s.total - s.active - s.completed,
  }))

  const cols: Column<MentoringEngagement>[] = [
    { key: 'companyName', header: 'شرکت', sortValue: (r) => r.companyName },
    { key: 'area', header: 'حوزه', align: 'center', sortValue: (r) => r.area },
    { key: 'mentorName', header: 'منتور', sortValue: (r) => r.mentorName },
    {
      key: 'progressPercent',
      header: 'پیشرفت',
      align: 'center',
      sortValue: (r) => r.progressPercent,
      render: (r) => (
        <div className="mx-auto w-28">
          <ProgressBar value={r.progressPercent} />
          <span className="fa-nums text-[11px] text-[rgb(var(--muted))]">{pct(r.progressPercent, 0)}</span>
        </div>
      ),
    },
    {
      key: 'nextSession',
      header: 'جلسه بعدی',
      align: 'center',
      sortValue: (r) => r.nextSession,
      render: (r) => <span className="fa-nums">{jDateShort(r.nextSession)}</span>,
    },
    {
      key: 'status',
      header: 'وضعیت',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="منتورینگ هوشمند شرکت‌ها"
        subtitle="مسیر رشد شخصی‌سازی‌شده در شش حوزه کلیدی توسعه کسب‌وکار"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(['همه', ...MENTORING_AREAS] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'rounded-xl border px-3 py-1.5 text-sm transition-colors',
              tab === t
                ? 'border-transparent bg-petro-600 text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل مسیرهای منتورینگ" value={filtered.length} icon={GraduationCap} />
        <Kpi label="در حال انجام" value={active} icon={Users} tone="brand" />
        <Kpi label="تکمیل‌شده" value={completed} icon={CheckCircle2} tone="gold" />
        <Kpi label="میانگین پیشرفت" value={pct(avgProgress)} icon={CalendarClock} />
      </div>

      <div className="mt-4">
        <ChartFrame title="وضعیت منتورینگ به تفکیک حوزه" height={320}>
          <Bars
            data={chart}
            xKey="area"
            stacked
            series={[
              { key: 'فعال', name: 'فعال' },
              { key: 'تکمیل‌شده', name: 'تکمیل‌شده', color: '#d4a24e' },
              { key: 'برنامه‌ریزی/متوقف', name: 'برنامه‌ریزی/متوقف', color: '#94a3b8' },
            ]}
          />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {summary.map((s) => (
          <Card key={s.area} title={s.area}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgb(var(--muted))]">میانگین پیشرفت</span>
              <span className="fa-nums font-bold">{pct(s.avgProgress, 0)}</span>
            </div>
            <div className="mt-2">
              <ProgressBar value={s.avgProgress} />
            </div>
            <p className="fa-nums mt-2 text-xs text-[rgb(var(--muted))]">
              {nf(s.active)} فعال · {nf(s.completed)} تکمیل‌شده · مجموع {nf(s.total)}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Card title={`مسیرهای منتورینگ — ${tab}`}>
          <DataTable columns={cols} rows={filtered} pageSize={12} initialSort={{ key: 'progressPercent', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
