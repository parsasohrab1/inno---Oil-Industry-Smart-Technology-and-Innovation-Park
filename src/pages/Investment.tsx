import { useMemo } from 'react'
import { Coins, Handshake, PiggyBank, Target } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge, ProgressBar } from '@/components/ui'
import { ChartFrame, Bars } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { fundingFunnel } from '@/services/analytics'
import { rial, nf, pct, jDateShort } from '@/lib/format'
import type { FundingRequest } from '@/lib/types'

const STAGE_TONE: Record<FundingRequest['stage'], 'gray' | 'blue' | 'amber' | 'green' | 'red'> = {
  'ثبت درخواست': 'gray',
  'بررسی اولیه': 'blue',
  'ارزیابی فنی': 'blue',
  مذاکره: 'amber',
  مصوب: 'green',
  'رد شده': 'red',
}

export default function Investment() {
  const { data, loading, error } = useDataset()

  const kpis = useMemo(() => {
    if (!data) return null
    const fr = data.fundingRequests
    const requested = fr.reduce((s, f) => s + f.amountRequestedRial, 0)
    const approved = fr.filter((f) => f.stage === 'مصوب')
    const approvedAmt = approved.reduce((s, f) => s + f.amountRequestedRial, 0)
    const inPipeline = fr.filter((f) => !['مصوب', 'رد شده'].includes(f.stage)).length
    return {
      requested,
      approvedAmt,
      approvalRate: (approved.length / fr.length) * 100,
      inPipeline,
      recommended: data.startups.filter((s) => s.investmentRecommendation).length,
    }
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data || !kpis) return null

  const funnel = fundingFunnel(data).map((f) => ({
    stage: f.stage,
    'تعداد درخواست': f.count,
    'مبلغ (میلیارد ریال)': +(f.amount / 1e9).toFixed(1),
  }))

  const byFund = Object.entries(
    data.fundingRequests.reduce<Record<string, { count: number; amount: number }>>((acc, f) => {
      acc[f.fund] ??= { count: 0, amount: 0 }
      acc[f.fund].count += 1
      acc[f.fund].amount += f.amountRequestedRial
      return acc
    }, {}),
  )
    .map(([fund, v]) => ({ fund, ...v }))
    .sort((a, b) => b.amount - a.amount)

  const cols: Column<FundingRequest>[] = [
    { key: 'companyName', header: 'شرکت', sortValue: (r) => r.companyName },
    { key: 'fund', header: 'صندوق', sortValue: (r) => r.fund },
    {
      key: 'amountRequestedRial',
      header: 'مبلغ درخواستی',
      align: 'end',
      sortValue: (r) => r.amountRequestedRial,
      render: (r) => <span className="fa-nums">{rial(r.amountRequestedRial)}</span>,
    },
    {
      key: 'successProbability',
      header: 'احتمال موفقیت',
      align: 'center',
      sortValue: (r) => r.successProbability,
      render: (r) => (
        <div className="mx-auto w-24">
          <ProgressBar value={r.successProbability} tone={r.successProbability > 60 ? 'brand' : 'gold'} />
          <span className="fa-nums text-[11px] text-[rgb(var(--muted))]">{pct(r.successProbability, 0)}</span>
        </div>
      ),
    },
    {
      key: 'submittedDate',
      header: 'تاریخ ثبت',
      align: 'center',
      sortValue: (r) => r.submittedDate,
      render: (r) => <span className="fa-nums">{jDateShort(r.submittedDate)}</span>,
    },
    {
      key: 'stage',
      header: 'مرحله',
      align: 'center',
      sortValue: (r) => r.stage,
      render: (r) => <Badge tone={STAGE_TONE[r.stage]}>{r.stage}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="جذب سرمایه"
        subtitle="تطبیق شرکت‌ها با صندوق‌ها، پیگیری درخواست‌ها و بهبود شانس جذب سرمایه"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل مبلغ درخواستی" value={rial(kpis.requested)} icon={Coins} />
        <Kpi label="تأمین مالی مصوب" value={rial(kpis.approvedAmt)} icon={PiggyBank} tone="gold" />
        <Kpi label="نرخ تصویب" value={pct(kpis.approvalRate)} icon={Target} />
        <Kpi label="در جریان بررسی" value={kpis.inPipeline} unit="درخواست" icon={Handshake} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartFrame title="قیف جذب سرمایه" subtitle="تعداد درخواست در هر مرحله">
          <Bars data={funnel} xKey="stage" series={[{ key: 'تعداد درخواست', name: 'تعداد' }]} />
        </ChartFrame>
        <Card title="صندوق‌های هدف — حجم درخواست">
          <ul className="space-y-3">
            {byFund.map((f) => (
              <li key={f.fund}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate">{f.fund}</span>
                  <span className="fa-nums shrink-0 text-xs text-[rgb(var(--muted))]">
                    {nf(f.count)} · {rial(f.amount)}
                  </span>
                </div>
                <ProgressBar value={(f.amount / byFund[0].amount) * 100} tone="gold" />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="درخواست‌های تأمین مالی">
          <DataTable columns={cols} rows={data.fundingRequests} pageSize={12} initialSort={{ key: 'amountRequestedRial', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
