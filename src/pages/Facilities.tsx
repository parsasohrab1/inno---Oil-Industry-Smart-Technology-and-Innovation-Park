import { useMemo } from 'react'
import { DoorOpen, CalendarCheck, Clock, XCircle } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { ChartFrame, Bars } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { roomUtilization } from '@/services/analytics'
import { nf, nf1, jDateTime } from '@/lib/format'
import type { BookingStatus, MeetingBooking } from '@/lib/types'

const TONE: Record<BookingStatus, 'green' | 'blue' | 'red'> = {
  Confirmed: 'blue',
  Completed: 'green',
  Cancelled: 'red',
}
const LABEL: Record<BookingStatus, string> = {
  Confirmed: 'Confirmed',
  Completed: 'Held',
  Cancelled: 'Cancelled',
}

export default function Facilities() {
  const { data, loading, error } = useDataset()

  const util = useMemo(() => (data ? roomUtilization(data) : []), [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const b = data.bookings
  const confirmed = b.filter((x) => x.status === 'Confirmed').length
  const cancelled = b.filter((x) => x.status === 'Cancelled').length
  const totalHours = b.filter((x) => x.status !== 'Cancelled').reduce((s, x) => s + x.durationMinutes, 0) / 60

  const chart = util.slice(0, 12).map((r) => ({ room: r.room, 'Usage hours': +(r.minutes / 60).toFixed(1) }))

  const cols: Column<MeetingBooking>[] = [
    { key: 'roomName', header: 'Room', sortValue: (r) => r.roomName },
    { key: 'companyName', header: 'Company', sortValue: (r) => r.companyName },
    {
      key: 'startTime',
      header: 'Start',
      align: 'center',
      sortValue: (r) => r.startTime,
      render: (r) => <span className="fa-nums">{jDateTime(r.startTime)}</span>,
    },
    {
      key: 'durationMinutes',
      header: 'Duration (minutes)',
      align: 'center',
      sortValue: (r) => r.durationMinutes,
      render: (r) => <span className="fa-nums">{nf(r.durationMinutes)}</span>,
    },
    {
      key: 'participantCount',
      header: 'Participants',
      align: 'center',
      sortValue: (r) => r.participantCount,
      render: (r) => <span className="fa-nums">{nf(r.participantCount)}</span>,
    },
    {
      key: 'isVirtual',
      header: 'Type',
      align: 'center',
      render: (r) => (r.isVirtual ? <Badge tone="gray">Virtual</Badge> : <Badge tone="blue">In person</Badge>),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Spaces and meeting room booking"
        subtitle="Smart resource management, real-time status display and automatic release with a presence sensor"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total bookings" value={b.length} icon={DoorOpen} />
        <Kpi label="Active booking" value={confirmed} icon={CalendarCheck} tone="brand" />
        <Kpi label="Usage hours" value={nf1(totalHours)} unit="hours" icon={Clock} tone="gold" />
        <Kpi label="Cancelled" value={cancelled} icon={XCircle} tone="rust" />
      </div>

      <div className="mt-4">
        <ChartFrame title="Room utilization" subtitle="Usage hours in the data interval">
          <Bars data={chart} xKey="room" series={[{ key: 'Usage hours', name: 'Hours' }]} format={(n) => nf1(n)} />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="Meeting room bookings">
          <DataTable columns={cols} rows={b} pageSize={12} initialSort={{ key: 'startTime', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
