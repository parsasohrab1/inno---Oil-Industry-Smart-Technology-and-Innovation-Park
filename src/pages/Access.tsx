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
    return attendanceTrend(data).map((r) => ({ date: r.date.slice(5), Attendance: r.present }))
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const v = data.vehicles
  const inbound = v.filter((x) => x.status === 'Inbound').length
  const unauthorized = v.filter((x) => !x.authorized).length
  const companiesById = new Map(data.companies.map((c) => [c.id, c.name]))

  const cols: Column<VehicleLog>[] = [
    { key: 'licensePlate', header: 'Plate', sortValue: (r) => r.licensePlate, render: (r) => <span className="fa-nums">{r.licensePlate}</span> },
    {
      key: 'companyOrigin',
      header: 'Originating company',
      sortValue: (r) => companiesById.get(r.companyOrigin) ?? '',
      render: (r) => companiesById.get(r.companyOrigin) ?? r.companyOrigin,
    },
    {
      key: 'entryTime',
      header: 'Entry time',
      align: 'center',
      sortValue: (r) => r.entryTime,
      render: (r) => <span className="fa-nums">{jDateTime(r.entryTime)}</span>,
    },
    {
      key: 'exitTime',
      header: 'Exit time',
      align: 'center',
      sortValue: (r) => r.exitTime ?? '',
      render: (r) => <span className="fa-nums">{r.exitTime ? jDateTime(r.exitTime) : '—'}</span>,
    },
    {
      key: 'authorized',
      header: 'Gate permit',
      align: 'center',
      sortValue: (r) => (r.authorized ? 1 : 0),
      render: (r) =>
        r.authorized ? <Badge tone="green">Opened</Badge> : <Badge tone="red">Blocked (debt/no permit)</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Traffic and physical security"
        subtitle="Face-recognition-based attendance and vehicle traffic control with a plate reader (LPR)"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total recorded traffic" value={v.length} icon={Car} />
        <Kpi label="Vehicles inside the park" value={inbound} icon={ShieldCheck} tone="brand" />
        <Kpi label="Attendance records" value={data.attendance.length} icon={UserCheck} />
        <Kpi label="Unauthorized traffic attempts" value={unauthorized} icon={ShieldAlert} tone="rust" />
      </div>

      <div className="mt-4">
        <ChartFrame title="Daily employee attendance trend" subtitle="Number of traffic records at the main entrance">
          <Lines data={trend} xKey="date" series={[{ key: 'Attendance', name: 'Attendance' }]} area />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="Vehicle traffic report (LPR) — integrated with the finance system">
          <DataTable columns={cols} rows={v} pageSize={12} initialSort={{ key: 'entryTime', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
