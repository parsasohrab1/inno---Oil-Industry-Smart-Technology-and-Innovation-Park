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
  باز: 'blue',
  'در حال ارزیابی': 'amber',
  برنده: 'green',
  بسته: 'gray',
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
  const open = opps.filter((o) => o.status === 'باز').length
  const won = opps.filter((o) => o.status === 'برنده').length

  const chart = bySector.map((s) => ({ sector: s.sector, 'ارزش (میلیارد ریال)': +(s.value / 1e9).toFixed(0) }))

  const cols: Column<DomesticOpportunity>[] = [
    { key: 'title', header: 'عنوان فرصت', sortValue: (r) => r.title },
    { key: 'buyer', header: 'کارفرما', sortValue: (r) => r.buyer },
    { key: 'sector', header: 'بخش', align: 'center', sortValue: (r) => r.sector },
    {
      key: 'estimatedValueRial',
      header: 'ارزش برآوردی',
      align: 'end',
      sortValue: (r) => r.estimatedValueRial,
      render: (r) => <span className="fa-nums">{rial(r.estimatedValueRial)}</span>,
    },
    {
      key: 'deadline',
      header: 'مهلت',
      align: 'center',
      sortValue: (r) => r.deadline,
      render: (r) => <span className="fa-nums">{jDateShort(r.deadline)}</span>,
    },
    {
      key: 'matched',
      header: 'شرکت‌های منطبق',
      align: 'center',
      render: (r) => <span className="fa-nums">{nf(r.matchedCompanyIds.length)}</span>,
    },
    {
      key: 'status',
      header: 'وضعیت',
      align: 'center',
      sortValue: (r) => r.status,
      render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="توسعه بازار داخلی"
        subtitle="ردیابی مناقصات و فرصت‌های تجاری صنعت نفت و تطبیق با شرکت‌های مستقر"
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل فرصت‌ها" value={opps.length} icon={Briefcase} />
        <Kpi label="ارزش کل بازار قابل‌دسترس" value={rial(totalValue)} icon={TrendingUp} tone="gold" />
        <Kpi label="فرصت‌های باز" value={open} icon={Timer} />
        <Kpi label="قراردادهای برنده‌شده" value={won} icon={Trophy} tone="brand" />
      </div>

      <div className="mt-4">
        <ChartFrame title="ارزش فرصت‌ها به تفکیک بخش صنعت" subtitle="میلیارد ریال">
          <Bars data={chart} xKey="sector" series={[{ key: 'ارزش (میلیارد ریال)', name: 'ارزش' }]} />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="فرصت‌های بازار داخلی">
          <DataTable columns={cols} rows={opps} pageSize={12} initialSort={{ key: 'estimatedValueRial', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
