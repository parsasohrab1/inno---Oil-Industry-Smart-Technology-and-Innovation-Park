import { useMemo } from 'react'
import { TrendingUp, Briefcase, Trophy, Timer } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { ChartFrame, Bars } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { rial, nf, jDateShort } from '@/lib/format'
import type { DomesticOpportunity } from '@/lib/types'

const TONE: Record<DomesticOpportunity['status'], 'blue' | 'amber' | 'green' | 'gray'> = {
  Open: 'blue',
  'Under evaluation': 'amber',
  Won: 'green',
  Closed: 'gray',
}

export default function DomesticMarket() {
  const { data, loading, error } = useDataset()

  const bySector = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { sector: string; count: number; value: number }>()
    for (const o of data.domesticOpportunities) {
      const row = map.get(o.sector) ?? { sector: o.sector, count: 0, value: 0 }
      row.count += 1
      row.value += o.estimatedValueRial
      map.set(o.sector, row)
    }
    return [...map.values()]
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const opps = data.domesticOpportunities
  const totalValue = opps.reduce((s, o) => s + o.estimatedValueRial, 0)
  const open = opps.filter((o) => o.status === 'Open').length
  const won = opps.filter((o) => o.status === 'Won').length

  const chart = bySector.map((s) => ({ sector: s.sector, 'Value (billion rials)': +(s.value / 1e9).toFixed(0) }))

  const cols: Column<DomesticOpportunity>[] = [
    { key: 'title', header: 'Opportunity title', sortValue: (r) => r.title },
    { key: 'buyer', header: 'Client', sortValue: (r) => r.buyer },
    { key: 'sector', header: 'Sector', align: 'center', sortValue: (r) => r.sector },
    {
      key: 'estimatedValueRial',
      header: 'Estimated value',
      align: 'end',
      sortValue: (r) => r.estimatedValueRial,
      render: (r) => <span className="fa-nums">{rial(r.estimatedValueRial)}</span>,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      align: 'center',
      sortValue: (r) => r.deadline,
      render: (r) => <span className="fa-nums">{jDateShort(r.deadline)}</span>,
    },
    {
      key: 'matched',
      header: 'Matching companies',
      align: 'center',
      render: (r) => <span className="fa-nums">{nf(r.matchedCompanyIds.length)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Domestic market development"
        subtitle="Tracking oil industry tenders and commercial opportunities and matching them with resident companies"
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total opportunities" value={opps.length} icon={Briefcase} />
        <Kpi label="Total accessible market value" value={rial(totalValue)} icon={TrendingUp} tone="gold" />
        <Kpi label="Open opportunities" value={open} icon={Timer} />
        <Kpi label="Won contracts" value={won} icon={Trophy} tone="brand" />
      </div>

      <div className="mt-4">
        <ChartFrame title="Opportunity value by industry sector" subtitle="Billion rials">
          <Bars data={chart} xKey="sector" series={[{ key: 'Value (billion rials)', name: 'Value' }]} />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="Domestic market opportunities">
          <DataTable columns={cols} rows={opps} pageSize={12} initialSort={{ key: 'estimatedValueRial', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
