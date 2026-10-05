import { useMemo } from 'react'
import { Rocket, Brain, DollarSign, Award } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { ChartFrame, Bars } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { topValuations } from '@/services/analytics'
import { rial, usd, nf1 } from '@/lib/format'
import type { StartupEvaluation } from '@/lib/types'

export default function Startups() {
  const { data, loading, error } = useDataset()

  const trlDist = useMemo(() => {
    if (!data) return []
    const map = new Map<number, number>()
    for (const s of data.startups) map.set(s.trlLevel, (map.get(s.trlLevel) ?? 0) + 1)
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([trl, count]) => ({ trl: `TRL ${trl}`, count }))
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const s = data.startups
  const recommended = s.filter((x) => x.investmentRecommendation).length
  const avgScore = s.reduce((a, x) => a + x.aiFinalScore, 0) / s.length
  const totalValuation = s.reduce((a, x) => a + x.valuationRial, 0)
  const totalSuggested = s.reduce((a, x) => a + x.suggestedInvestmentRial, 0)

  const cols: Column<StartupEvaluation>[] = [
    { key: 'teamName', header: 'Team', sortValue: (r) => r.teamName },
    { key: 'ideaTitle', header: 'Idea', sortValue: (r) => r.ideaTitle },
    {
      key: 'teamScore',
      header: 'Team (30%)',
      align: 'center',
      sortValue: (r) => r.teamScore,
      render: (r) => <span className="fa-nums">{nf1(r.teamScore)}</span>,
    },
    {
      key: 'productScore',
      header: 'Product (35%)',
      align: 'center',
      sortValue: (r) => r.productScore,
      render: (r) => <span className="fa-nums">{nf1(r.productScore)}</span>,
    },
    {
      key: 'marketScore',
      header: 'Market (35%)',
      align: 'center',
      sortValue: (r) => r.marketScore,
      render: (r) => <span className="fa-nums">{nf1(r.marketScore)}</span>,
    },
    {
      key: 'aiFinalScore',
      header: 'Final AI score',
      align: 'center',
      sortValue: (r) => r.aiFinalScore,
      render: (r) => (
        <span className={'fa-nums font-bold ' + (r.aiFinalScore > 68 ? 'text-petro-600' : '')}>
          {nf1(r.aiFinalScore)}
        </span>
      ),
    },
    {
      key: 'valuationRial',
      header: 'Valuation',
      align: 'end',
      sortValue: (r) => r.valuationRial,
      render: (r) => (
        <div className="text-end">
          <div className="fa-nums">{rial(r.valuationRial)}</div>
          <div className="fa-nums text-[11px] text-[rgb(var(--muted))]">≈ {usd(r.valuationUsd)}</div>
        </div>
      ),
    },
    {
      key: 'rec',
      header: 'Recommendation',
      align: 'center',
      sortValue: (r) => (r.investmentRecommendation ? 1 : 0),
      render: (r) =>
        r.investmentRecommendation ? <Badge tone="green">Invest</Badge> : <Badge tone="gray">Monitor</Badge>,
    },
  ]

  const scatter = topValuations(data, 12).map((x) => ({
    team: x.teamName.replace('Team ', ''),
    'Value (billion rials)': +(x.valuationRial / 1e9).toFixed(1),
  }))

  return (
    <div>
      <PageHeader
        title="Smart startup judging and valuation"
        subtitle="Three-axis scoring (team/product/market) and estimation of company value in rials"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total evaluated projects" value={s.length} icon={Rocket} />
        <Kpi label="Average AI score" value={nf1(avgScore)} icon={Brain} tone="gold" />
        <Kpi label="Investment recommendations" value={recommended} icon={Award} tone="brand" />
        <Kpi label="Total portfolio value" value={rial(totalValuation)} icon={DollarSign} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartFrame title="Technology readiness level (TRL) distribution">
          <Bars data={trlDist} xKey="trl" series={[{ key: 'count', name: 'Number of projects' }]} />
        </ChartFrame>
        <ChartFrame title="Most valuable teams" subtitle="Billion rials">
          <Bars
            data={scatter}
            xKey="team"
            series={[{ key: 'Value (billion rials)', name: 'Value' }]}
            format={(n) => nf1(n)}
          />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title={`Total suggested investment: ${rial(totalSuggested)}`}>
          <DataTable columns={cols} rows={s} pageSize={12} initialSort={{ key: 'aiFinalScore', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
