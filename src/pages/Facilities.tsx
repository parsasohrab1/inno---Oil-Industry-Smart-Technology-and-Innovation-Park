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
  Confirmed: 'تأییدشده',
  Completed: 'برگزارشده',
  Cancelled: 'لغوشده',
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

  const chart = util.slice(0, 12).map((r) => ({ room: r.room, 'ساعت استفاده': +(r.minutes / 60).toFixed(1) }))

  const cols: Column<MeetingBooking>[] = [
    { key: 'roomName', header: 'اتاق', sortValue: (r) => r.roomName },
    { key: 'companyName', header: 'شرکت', sortValue: (r) => r.companyName },
    {
      key: 'startTime',
      header: 'شروع',
      align: 'center',
      sortValue: (r) => r.startTime,
      render: (r) => <span className="fa-nums">{jDateTime(r.startTime)}</span>,
    },
    {
      key: 'durationMinutes',
      header: 'مدت (دقیقه)',
      align: 'center',
      sortValue: (r) => r.durationMinutes,
      render: (r) => <span className="fa-nums">{nf(r.durationMinutes)}</span>,
    },
    {
      key: 'participantCount',
      header: 'شرکت‌کنندگان',
      align: 'center',
      sortValue: (r) => r.participantCount,
      render: (r) => <span className="fa-nums">{nf(r.participantCount)}</span>,
    },
    {
      key: 'isVirtual',
      header: 'نوع',
      align: 'center',
      render: (r) => (r.isVirtual ? <Badge tone="gray">مجازی</Badge> : <Badge tone="blue">حضوری</Badge>),
    },
    {
      key: 'status',
      header: 'وضعیت',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="فضاها و رزرو اتاق جلسات"
        subtitle="مدیریت هوشمند منابع، نمایش وضعیت لحظه‌ای و آزادسازی خودکار با سنسور حضور"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل رزروها" value={b.length} icon={DoorOpen} />
        <Kpi label="رزرو فعال" value={confirmed} icon={CalendarCheck} tone="brand" />
        <Kpi label="ساعت استفاده" value={nf1(totalHours)} unit="ساعت" icon={Clock} tone="gold" />
        <Kpi label="لغوشده" value={cancelled} icon={XCircle} tone="rust" />
      </div>

      <div className="mt-4">
        <ChartFrame title="میزان بهره‌برداری اتاق‌ها" subtitle="ساعت استفاده در بازه داده">
          <Bars data={chart} xKey="room" series={[{ key: 'ساعت استفاده', name: 'ساعت' }]} format={(n) => nf1(n)} />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="رزروهای اتاق جلسات">
          <DataTable columns={cols} rows={b} pageSize={12} initialSort={{ key: 'startTime', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
