import { useMemo, useState } from 'react'
import { Coins, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { ChartFrame, Bars } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { rentByPeriod, debtors } from '@/services/analytics'
import { rial, nf, pct, jDateShort } from '@/lib/format'
import type { PaymentStatus, RentalInvoice } from '@/lib/types'

const STATUS_LABEL: Record<PaymentStatus, string> = {
  Paid: 'پرداخت‌شده',
  Overdue: 'معوق',
  Pending: 'در انتظار',
}
const STATUS_TONE: Record<PaymentStatus, 'green' | 'red' | 'amber'> = {
  Paid: 'green',
  Overdue: 'red',
  Pending: 'amber',
}

export default function Finance() {
  const { data, loading, error } = useDataset()
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all')

  const kpis = useMemo(() => {
    if (!data) return null
    const inv = data.rentalInvoices
    const billed = inv.reduce((s, r) => s + r.totalRent, 0)
    const collected = inv.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.totalRent, 0)
    const overdue = inv
      .filter((r) => r.status === 'Overdue')
      .reduce((s, r) => s + r.totalRent + r.penalty, 0)
    const penalties = inv.reduce((s, r) => s + r.penalty, 0)
    return { billed, collected, overdue, penalties, rate: (collected / billed) * 100 }
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data || !kpis) return null

  const series = rentByPeriod(data).map((r) => ({
    period: r.period,
    صورتحساب: +(r.billed / 1e9).toFixed(1),
    وصول: +(r.collected / 1e9).toFixed(1),
    معوق: +(r.overdue / 1e9).toFixed(1),
  }))

  const debtorRows = debtors(data)
  const debtorCols: Column<(typeof debtorRows)[number]>[] = [
    { key: 'companyName', header: 'شرکت', sortValue: (r) => r.companyName },
    {
      key: 'months',
      header: 'ماه معوقه',
      align: 'center',
      sortValue: (r) => r.months,
      render: (r) => <span className="fa-nums">{nf(r.months)}</span>,
    },
    {
      key: 'amount',
      header: 'مبلغ بدهی',
      align: 'end',
      sortValue: (r) => r.amount,
      render: (r) => <span className="fa-nums">{rial(r.amount)}</span>,
    },
    {
      key: 'gate',
      header: 'وضعیت دسترسی',
      align: 'center',
      render: (r) =>
        r.gateRevoked ? <Badge tone="red">گیت و چهره مسدود</Badge> : <Badge tone="amber">تذکر پرداخت</Badge>,
    },
  ]

  const invoices = filter === 'all' ? data.rentalInvoices : data.rentalInvoices.filter((r) => r.status === filter)
  const invCols: Column<RentalInvoice>[] = [
    { key: 'companyName', header: 'شرکت', sortValue: (r) => r.companyName },
    { key: 'period', header: 'دوره', align: 'center' },
    {
      key: 'totalRent',
      header: 'مبلغ اجاره',
      align: 'end',
      sortValue: (r) => r.totalRent,
      render: (r) => <span className="fa-nums">{rial(r.totalRent)}</span>,
    },
    {
      key: 'dueDate',
      header: 'سررسید',
      align: 'center',
      sortValue: (r) => r.dueDate,
      render: (r) => <span className="fa-nums">{jDateShort(r.dueDate)}</span>,
    },
    {
      key: 'penalty',
      header: 'جریمه',
      align: 'end',
      sortValue: (r) => r.penalty,
      render: (r) => <span className="fa-nums">{r.penalty ? rial(r.penalty) : '—'}</span>,
    },
    {
      key: 'status',
      header: 'وضعیت',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="مالی و اجاره‌بها"
        subtitle="کنترل هوشمند صورتحساب، وصول مطالبات و اتصال به گیت‌های تردد"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل صورتحساب دوره" value={rial(kpis.billed)} icon={Coins} />
        <Kpi label="وصول‌شده" value={rial(kpis.collected)} icon={CheckCircle2} />
        <Kpi label="مطالبات معوق" value={rial(kpis.overdue)} icon={TrendingDown} tone="rust" />
        <Kpi label="نرخ وصول" value={pct(kpis.rate)} icon={AlertTriangle} tone="gold" />
      </div>

      <div className="mt-4">
        <ChartFrame title="صورتحساب، وصول و مطالبات معوق" subtitle="میلیارد ریال به تفکیک دوره">
          <Bars
            data={series}
            xKey="period"
            series={[
              { key: 'صورتحساب', name: 'صورتحساب' },
              { key: 'وصول', name: 'وصول', color: '#d4a24e' },
              { key: 'معوق', name: 'معوق', color: '#b4531f' },
            ]}
          />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="شرکت‌های بدهکار — اتصال به کنترل تردد">
          <DataTable columns={debtorCols} rows={debtorRows} pageSize={8} />
        </Card>
        <Card
          title="صورتحساب‌ها"
          action={
            <select
              className="rounded-lg border bg-transparent px-2 py-1 text-xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value as PaymentStatus | 'all')}
            >
              <option value="all">همه</option>
              <option value="Paid">پرداخت‌شده</option>
              <option value="Overdue">معوق</option>
              <option value="Pending">در انتظار</option>
            </select>
          }
        >
          <DataTable columns={invCols} rows={invoices} pageSize={8} initialSort={{ key: 'dueDate', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
