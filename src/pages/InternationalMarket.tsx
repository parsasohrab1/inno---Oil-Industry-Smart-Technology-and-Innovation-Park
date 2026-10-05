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
    () => (data ? [...data.markets].filter((m) => m.region !== 'Domestic') : []),
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
    .map((m) => ({ country: m.country, 'Market size (billion dollars)': +(m.marketSizeUsd / 1e9).toFixed(1) }))

  const sel = selected ? rows.find((m) => m.country === selected) : rows[0]
  const radarData = sel
    ? [
        { axis: 'Market growth', value: Math.min(100, sel.growthRate * 4) },
        { axis: 'Ease of doing business', value: sel.easeOfBusiness },
        { axis: 'Technology readiness', value: sel.techReadiness },
        { axis: 'Political stability', value: sel.politicalStability },
        { axis: 'Oil and gas share', value: sel.oilGasShare },
        { axis: 'Low tariff', value: 100 - sel.tariffRate * 3 },
      ]
    : []

  const cols: Column<MarketRow>[] = [
    { key: 'country', header: 'Country', sortValue: (r) => r.country },
    { key: 'region', header: 'Region', align: 'center', sortValue: (r) => r.region },
    {
      key: 'marketSizeUsd',
      header: 'Market size',
      align: 'end',
      sortValue: (r) => r.marketSizeUsd,
      render: (r) => <span className="fa-nums">{usd(r.marketSizeUsd)}</span>,
    },
    {
      key: 'growthRate',
      header: 'Growth rate',
      align: 'center',
      sortValue: (r) => r.growthRate,
      render: (r) => (
        <span className={r.growthRate >= 0 ? 'text-petro-600' : 'text-oil-rust'}>{pct(r.growthRate)}</span>
      ),
    },
    {
      key: 'tariffRate',
      header: 'Tariff',
      align: 'center',
      sortValue: (r) => r.tariffRate,
      render: (r) => <span className="fa-nums">{pct(r.tariffRate)}</span>,
    },
    {
      key: 'competitorCount',
      header: 'Competitors',
      align: 'center',
      sortValue: (r) => r.competitorCount,
      render: (r) => <span className="fa-nums">{nf1(r.competitorCount)}</span>,
    },
    {
      key: 'action',
      header: 'Analysis',
      align: 'center',
      render: (r) => (
        <button className="text-xs text-petro-600 hover:underline" onClick={() => setSelected(r.country)}>
          Show radar
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="International market development"
        subtitle="Analysis of export target markets, tariffs and attractiveness indicators"
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total accessible market (TAM)" value={usd(totalTam)} icon={Globe2} />
        <Kpi label="Average growth rate" value={pct(avgGrowth)} icon={ArrowUpRight} tone="gold" />
        <Kpi label="Attractive markets" value={attractive} unit="countries" icon={Gauge} tone="brand" />
        <Kpi label="Target countries" value={rows.length} icon={ShieldCheck} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartFrame title="Largest target markets" subtitle="Billion dollars">
            <Bars
              data={topMarkets}
              xKey="country"
              series={[{ key: 'Market size (billion dollars)', name: 'Market size' }]}
              format={(n) => nf1(n)}
            />
          </ChartFrame>
        </div>
        <ChartFrame title={`Attractiveness profile — ${sel?.country ?? ''}`} height={320}>
          <RadarBox data={radarData} angleKey="axis" series={[{ key: 'value', name: 'Score' }]} />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="Complete table of international markets">
          <DataTable columns={cols} rows={rows} pageSize={12} initialSort={{ key: 'marketSizeUsd', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
