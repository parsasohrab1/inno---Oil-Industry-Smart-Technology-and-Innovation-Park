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
  Paid: 'Paid',
  Overdue: 'Overdue',
  Pending: 'Pending',
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
    Invoiced: +(r.billed / 1e9).toFixed(1),
    Collected: +(r.collected / 1e9).toFixed(1),
    Overdue: +(r.overdue / 1e9).toFixed(1),
  }))

  const debtorRows = debtors(data)
  const debtorCols: Column<(typeof debtorRows)[number]>[] = [
    { key: 'companyName', header: 'Company', sortValue: (r) => r.companyName },
    {
      key: 'months',
      header: 'Months overdue',
      align: 'center',
      sortValue: (r) => r.months,
      render: (r) => <span className="fa-nums">{nf(r.months)}</span>,
    },
    {
      key: 'amount',
      header: 'Debt amount',
      align: 'end',
      sortValue: (r) => r.amount,
      render: (r) => <span className="fa-nums">{rial(r.amount)}</span>,
    },
    {
      key: 'gate',
      header: 'Access status',
      align: 'center',
      render: (r) =>
        r.gateRevoked ? <Badge tone="red">Gate and face blocked</Badge> : <Badge tone="amber">Payment reminder</Badge>,
    },
  ]

  const invoices = filter === 'all' ? data.rentalInvoices : data.rentalInvoices.filter((r) => r.status === filter)
  const invCols: Column<RentalInvoice>[] = [
    { key: 'companyName', header: 'Company', sortValue: (r) => r.companyName },
    { key: 'period', header: 'Period', align: 'center' },
    {
      key: 'totalRent',
      header: 'Rent amount',
      align: 'end',
      sortValue: (r) => r.totalRent,
      render: (r) => <span className="fa-nums">{rial(r.totalRent)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due date',
      align: 'center',
      sortValue: (r) => r.dueDate,
      render: (r) => <span className="fa-nums">{jDateShort(r.dueDate)}</span>,
    },
    {
      key: 'penalty',
      header: 'Penalty',
      align: 'end',
      sortValue: (r) => r.penalty,
      render: (r) => <span className="fa-nums">{r.penalty ? rial(r.penalty) : '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Finance and rent"
        subtitle="Smart invoice control, receivables collection and connection to traffic gates"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total invoiced for the period" value={rial(kpis.billed)} icon={Coins} />
        <Kpi label="Collected" value={rial(kpis.collected)} icon={CheckCircle2} />
        <Kpi label="Overdue receivables" value={rial(kpis.overdue)} icon={TrendingDown} tone="rust" />
        <Kpi label="Collection rate" value={pct(kpis.rate)} icon={AlertTriangle} tone="gold" />
      </div>

      <div className="mt-4">
        <ChartFrame title="Invoices, collections and overdue receivables" subtitle="Billion rials by period">
          <Bars
            data={series}
            xKey="period"
            series={[
              { key: 'Invoiced', name: 'Invoiced' },
              { key: 'Collected', name: 'Collected', color: '#d4a24e' },
              { key: 'Overdue', name: 'Overdue', color: '#b4531f' },
            ]}
          />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Companies in arrears — connection to traffic control">
          <DataTable columns={debtorCols} rows={debtorRows} pageSize={8} />
        </Card>
        <Card
          title="Invoices"
          action={
            <select
              className="rounded-lg border bg-transparent px-2 py-1 text-xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value as PaymentStatus | 'all')}
            >
              <option value="all">All</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending</option>
            </select>
          }
        >
          <DataTable columns={invCols} rows={invoices} pageSize={8} initialSort={{ key: 'dueDate', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
