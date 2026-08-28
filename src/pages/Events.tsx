import { useMemo } from 'react'
import { CalendarDays, Users, CheckCircle2, Megaphone } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge, ProgressBar } from '@/components/ui'
import { ChartFrame, Bars } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { nf, pct, jDateTime } from '@/lib/format'
import type { EventStatus, ParkEvent } from '@/lib/types'

const TONE: Record<EventStatus, 'green' | 'blue' | 'amber' | 'red'> = {
  برگزارشده: 'green',
  'در حال برگزاری': 'blue',
  'برنامه‌ریزی‌شده': 'amber',
  لغوشده: 'red',
}

export default function Events() {
  const { data, loading, error } = useDataset()

  const byType = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { type: string; count: number; registered: number }>()
    for (const e of data.events) {
      const row = map.get(e.type) ?? { type: e.type, count: 0, registered: 0 }
      row.count += 1
      row.registered += e.registeredCount
      map.set(e.type, row)
    }
    return [...map.values()]
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const now = Date.parse(data.generatedAt)
  const e = data.events
  const upcoming = e.filter((x) => x.status === 'برنامه‌ریزی‌شده' && Date.parse(x.startDate) > now)
  const held = e.filter((x) => x.status === 'برگزارشده').length
  const totalRegistered = e.reduce((s, x) => s + x.registeredCount, 0)
  const fillRate =
    (e.reduce((s, x) => s + x.registeredCount, 0) / e.reduce((s, x) => s + x.maxParticipants, 0)) * 100

  const chart = byType.map((t) => ({ type: t.type, تعداد: t.count, 'ثبت‌نام': t.registered }))

  const cols: Column<ParkEvent>[] = [
    { key: 'title', header: 'عنوان', sortValue: (r) => r.title },
    { key: 'type', header: 'نوع', align: 'center', sortValue: (r) => r.type },
    { key: 'location', header: 'محل', align: 'center', sortValue: (r) => r.location },
    {
      key: 'startDate',
      header: 'زمان',
      align: 'center',
      sortValue: (r) => r.startDate,
      render: (r) => <span className="fa-nums">{jDateTime(r.startDate)}</span>,
    },
    {
      key: 'fill',
      header: 'ظرفیت',
      align: 'center',
      sortValue: (r) => r.registeredCount / r.maxParticipants,
      render: (r) => (
        <div className="mx-auto w-28">
          <ProgressBar value={(r.registeredCount / r.maxParticipants) * 100} tone="gold" />
          <span className="fa-nums text-[11px] text-[rgb(var(--muted))]">
            {nf(r.registeredCount)}/{nf(r.maxParticipants)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'وضعیت',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="تقویم رویدادهای پارک"
        subtitle="دمو دی، ریورس پیچ، پیچ، کارگاه‌ها و همایش‌ها با ثبت‌نام آنلاین"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل رویدادها" value={e.length} icon={CalendarDays} />
        <Kpi label="رویدادهای پیش‌رو" value={upcoming.length} icon={Megaphone} tone="gold" />
        <Kpi label="برگزارشده" value={held} icon={CheckCircle2} tone="brand" />
        <Kpi label="کل ثبت‌نام" value={totalRegistered} unit={`(${pct(fillRate, 0)} ظرفیت)`} icon={Users} />
      </div>

      <div className="mt-4">
        <ChartFrame title="رویدادها و ثبت‌نام به تفکیک نوع">
          <Bars
            data={chart}
            xKey="type"
            series={[
              { key: 'تعداد', name: 'تعداد رویداد' },
              { key: 'ثبت‌نام', name: 'ثبت‌نام', color: '#d4a24e' },
            ]}
          />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {upcoming.slice(0, 6).map((ev) => (
          <Card key={ev.id} title={ev.type}>
            <p className="text-sm font-medium">{ev.title}</p>
            <p className="fa-nums mt-1 text-xs text-[rgb(var(--muted))]">
              {jDateTime(ev.startDate)} · {ev.location}
            </p>
            <div className="mt-3">
              <ProgressBar value={(ev.registeredCount / ev.maxParticipants) * 100} tone="gold" />
              <p className="fa-nums mt-1 text-xs text-[rgb(var(--muted))]">
                {nf(ev.registeredCount)} از {nf(ev.maxParticipants)} نفر ثبت‌نام
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Card title="همه رویدادها">
          <DataTable columns={cols} rows={e} pageSize={12} initialSort={{ key: 'startDate', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
