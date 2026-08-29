import { useMemo, useState } from 'react'
import { Globe2, Gauge, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card } from '@/components/ui'
import { ChartFrame, Bars, RadarBox } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { usd, nf1, pct } from '@/lib/format'
import type { MarketRow } from '@/lib/types'

export default function InternationalMarket() {
  const { data, loading, error } = useDataset()
  const [selected, setSelected] = useState<string | null>(null)

  const rows = useMemo(
    () => (data ? [...data.markets].filter((m) => m.region !== 'داخلی') : []),
    [data],
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const totalTam = rows.reduce((s, m) => s + m.marketSizeUsd, 0)
  const avgGrowth = rows.reduce((s, m) => s + m.growthRate, 0) / rows.length
  const attractive = rows.filter((m) => m.growthRate > 8 && m.tariffRate < 15).length

  const topMarkets = [...rows]
    .sort((a, b) => b.marketSizeUsd - a.marketSizeUsd)
    .slice(0, 10)
    .map((m) => ({ country: m.country, 'اندازه بازار (میلیارد دلار)': +(m.marketSizeUsd / 1e9).toFixed(1) }))

  const sel = selected ? rows.find((m) => m.country === selected) : rows[0]
  const radarData = sel
    ? [
        { axis: 'رشد بازار', value: Math.min(100, sel.growthRate * 4) },
        { axis: 'سهولت کسب‌وکار', value: sel.easeOfBusiness },
        { axis: 'آمادگی فناوری', value: sel.techReadiness },
        { axis: 'ثبات سیاسی', value: sel.politicalStability },
        { axis: 'سهم نفت و گاز', value: sel.oilGasShare },
        { axis: 'تعرفه پایین', value: 100 - sel.tariffRate * 3 },
      ]
    : []

  const cols: Column<MarketRow>[] = [
    { key: 'country', header: 'کشور', sortValue: (r) => r.country },
    { key: 'region', header: 'منطقه', align: 'center', sortValue: (r) => r.region },
    {
      key: 'marketSizeUsd',
      header: 'اندازه بازار',
      align: 'end',
      sortValue: (r) => r.marketSizeUsd,
      render: (r) => <span className="fa-nums">{usd(r.marketSizeUsd)}</span>,
    },
    {
      key: 'growthRate',
      header: 'نرخ رشد',
      align: 'center',
      sortValue: (r) => r.growthRate,
      render: (r) => (
        <span className={r.growthRate >= 0 ? 'text-petro-600' : 'text-oil-rust'}>{pct(r.growthRate)}</span>
      ),
    },
    {
      key: 'tariffRate',
      header: 'تعرفه',
      align: 'center',
      sortValue: (r) => r.tariffRate,
      render: (r) => <span className="fa-nums">{pct(r.tariffRate)}</span>,
    },
    {
      key: 'competitorCount',
      header: 'رقبا',
      align: 'center',
      sortValue: (r) => r.competitorCount,
      render: (r) => <span className="fa-nums">{nf1(r.competitorCount)}</span>,
    },
    {
      key: 'action',
      header: 'تحلیل',
      align: 'center',
      render: (r) => (
        <button className="text-xs text-petro-600 hover:underline" onClick={() => setSelected(r.country)}>
          نمایش رادار
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="توسعه بازار بین‌المللی"
        subtitle="تحلیل بازارهای هدف صادراتی، تعرفه‌ها و شاخص‌های جذابیت"
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل بازار قابل‌دسترس (TAM)" value={usd(totalTam)} icon={Globe2} />
        <Kpi label="میانگین نرخ رشد" value={pct(avgGrowth)} icon={ArrowUpRight} tone="gold" />
        <Kpi label="بازارهای جذاب" value={attractive} unit="کشور" icon={Gauge} tone="brand" />
        <Kpi label="کشورهای هدف" value={rows.length} icon={ShieldCheck} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartFrame title="بزرگ‌ترین بازارهای هدف" subtitle="میلیارد دلار">
            <Bars
              data={topMarkets}
              xKey="country"
              series={[{ key: 'اندازه بازار (میلیارد دلار)', name: 'اندازه بازار' }]}
              format={(n) => nf1(n)}
            />
          </ChartFrame>
        </div>
        <ChartFrame title={`نیم‌رخ جذابیت — ${sel?.country ?? ''}`} height={320}>
          <RadarBox data={radarData} angleKey="axis" series={[{ key: 'value', name: 'امتیاز' }]} />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="جدول کامل بازارهای بین‌المللی">
          <DataTable columns={cols} rows={rows} pageSize={12} initialSort={{ key: 'marketSizeUsd', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
