import { useMemo } from 'react'
import { ShieldCheck, Car, UserCheck, ShieldAlert } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { ChartFrame, Lines } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { attendanceTrend } from '@/services/analytics'
import { jDateTime } from '@/lib/format'
import type { VehicleLog } from '@/lib/types'

export default function Access() {
  const { data, loading, error } = useDataset()

  const trend = useMemo(() => {
    if (!data) return []
    return attendanceTrend(data).map((r) => ({ date: r.date.slice(5), حضور: r.present }))
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const v = data.vehicles
  const inbound = v.filter((x) => x.status === 'Inbound').length
  const unauthorized = v.filter((x) => !x.authorized).length
  const companiesById = new Map(data.companies.map((c) => [c.id, c.name]))

  const cols: Column<VehicleLog>[] = [
    { key: 'licensePlate', header: 'پلاک', sortValue: (r) => r.licensePlate, render: (r) => <span className="fa-nums">{r.licensePlate}</span> },
    {
      key: 'companyOrigin',
      header: 'شرکت مبدأ',
      sortValue: (r) => companiesById.get(r.companyOrigin) ?? '',
      render: (r) => companiesById.get(r.companyOrigin) ?? r.companyOrigin,
    },
    {
      key: 'entryTime',
      header: 'زمان ورود',
      align: 'center',
      sortValue: (r) => r.entryTime,
      render: (r) => <span className="fa-nums">{jDateTime(r.entryTime)}</span>,
    },
    {
      key: 'exitTime',
      header: 'زمان خروج',
      align: 'center',
      sortValue: (r) => r.exitTime ?? '',
      render: (r) => <span className="fa-nums">{r.exitTime ? jDateTime(r.exitTime) : '—'}</span>,
    },
    {
      key: 'authorized',
      header: 'مجوز گیت',
      align: 'center',
      sortValue: (r) => (r.authorized ? 1 : 0),
      render: (r) =>
        r.authorized ? <Badge tone="green">باز شد</Badge> : <Badge tone="red">مسدود (بدهی/بدون مجوز)</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="تردد و امنیت فیزیکی"
        subtitle="حضور و غیاب مبتنی بر تشخیص چهره و کنترل تردد خودرو با پلاک‌خوان (LPR)"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل ترددهای ثبت‌شده" value={v.length} icon={Car} />
        <Kpi label="خودرو داخل پارک" value={inbound} icon={ShieldCheck} tone="brand" />
        <Kpi label="رکورد حضور و غیاب" value={data.attendance.length} icon={UserCheck} />
        <Kpi label="تلاش تردد غیرمجاز" value={unauthorized} icon={ShieldAlert} tone="rust" />
      </div>

      <div className="mt-4">
        <ChartFrame title="روند حضور روزانه کارکنان" subtitle="تعداد ترددهای ثبت‌شده در ورودی اصلی">
          <Lines data={trend} xKey="date" series={[{ key: 'حضور', name: 'حضور' }]} area />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="گزارش تردد خودرو (LPR) — یکپارچه با سیستم مالی">
          <DataTable columns={cols} rows={v} pageSize={12} initialSort={{ key: 'entryTime', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
