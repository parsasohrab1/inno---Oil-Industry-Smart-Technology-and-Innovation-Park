import { useMemo } from 'react'
import { Building2, BadgeCheck, Layers, Ruler } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { ChartFrame, Bars, Donut } from '@/components/charts'
import { DataTable, type Column } from '@/components/DataTable'
import { companiesByField, companyProfit } from '@/services/analytics'
import { nf, rial, pct, jDateShort } from '@/lib/format'
import type { Company } from '@/lib/types'

export default function Companies() {
  const { data, loading, error } = useDataset()

  const profitByCompany = useMemo(() => {
    if (!data) return new Map<string, number>()
    return new Map(companyProfit(data).map((p) => [p.companyId, p.profit]))
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const c = data.companies
  const kb = c.filter((x) => x.isKnowledgeBased).length
  const patents = c.filter((x) => x.hasPatent).length
  const totalArea = c.reduce((s, x) => s + x.areaM2, 0)

  const fields = companiesByField(data).map((f) => ({ name: f.field, value: f.count }))
  const maturity = [1, 2, 3, 4, 5].map((lvl) => ({
    level: `Level ${lvl}`,
    count: c.filter((x) => x.maturityLevel === lvl).length,
  }))

  const debtByCompany = new Map<string, number>()
  for (const inv of data.rentalInvoices) {
    if (inv.status === 'Overdue')
      debtByCompany.set(inv.tenantId, (debtByCompany.get(inv.tenantId) ?? 0) + inv.totalRent + inv.penalty)
  }

  const cols: Column<Company>[] = [
    { key: 'name', header: 'Company name', sortValue: (r) => r.name },
    { key: 'field', header: 'Field', align: 'center', sortValue: (r) => r.field },
    {
      key: 'employeeCount',
      header: 'Employees',
      align: 'center',
      sortValue: (r) => r.employeeCount,
      render: (r) => <span className="fa-nums">{nf(r.employeeCount)}</span>,
    },
    {
      key: 'areaM2',
      header: 'Area (m²)',
      align: 'center',
      sortValue: (r) => r.areaM2,
      render: (r) => <span className="fa-nums">{nf(r.areaM2)}</span>,
    },
    {
      key: 'maturityLevel',
      header: 'Maturity',
      align: 'center',
      sortValue: (r) => r.maturityLevel,
      render: (r) => <span className="fa-nums">{nf(r.maturityLevel)}/5</span>,
    },
    {
      key: 'establishmentDate',
      header: 'Founded',
      align: 'center',
      sortValue: (r) => r.establishmentDate,
      render: (r) => <span className="fa-nums">{jDateShort(r.establishmentDate)}</span>,
    },
    {
      key: 'flags',
      header: 'Status',
      align: 'center',
      render: (r) => (
        <div className="flex flex-wrap justify-center gap-1">
          {r.isKnowledgeBased && <Badge tone="green">Knowledge-based</Badge>}
          {r.hasPatent && <Badge tone="blue">Has patent</Badge>}
          {(debtByCompany.get(r.id) ?? 0) > 0 && <Badge tone="red">In arrears</Badge>}
        </div>
      ),
    },
    {
      key: 'profit',
      header: 'Net profit (cumulative)',
      align: 'end',
      sortValue: (r) => profitByCompany.get(r.id) ?? 0,
      render: (r) => {
        const p = profitByCompany.get(r.id) ?? 0
        return <span className={'fa-nums ' + (p < 0 ? 'text-oil-rust' : '')}>{rial(p)}</span>
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Resident companies"
        subtitle="Complete company profiles, knowledge-based status, space occupancy and financial performance"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total companies" value={c.length} icon={Building2} />
        <Kpi label="Knowledge-based" value={kb} unit={`(${pct((kb / c.length) * 100, 0)})`} icon={BadgeCheck} tone="gold" />
        <Kpi label="With patents" value={patents} icon={Layers} />
        <Kpi label="Total occupied space" value={totalArea} unit="square meters" icon={Ruler} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartFrame title="Company mix by field of activity">
          <Donut data={fields} nameKey="name" valueKey="value" />
        </ChartFrame>
        <ChartFrame title="Distribution of company technology maturity levels">
          <Bars data={maturity} xKey="level" series={[{ key: 'count', name: 'Number of companies' }]} />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="List of resident companies">
          <DataTable columns={cols} rows={c} pageSize={15} initialSort={{ key: 'employeeCount', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
