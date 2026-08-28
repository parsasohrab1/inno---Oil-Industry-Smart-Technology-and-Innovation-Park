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
    level: `سطح ${lvl}`,
    count: c.filter((x) => x.maturityLevel === lvl).length,
  }))

  const debtByCompany = new Map<string, number>()
  for (const inv of data.rentalInvoices) {
    if (inv.status === 'Overdue')
      debtByCompany.set(inv.tenantId, (debtByCompany.get(inv.tenantId) ?? 0) + inv.totalRent + inv.penalty)
  }

  const cols: Column<Company>[] = [
    { key: 'name', header: 'نام شرکت', sortValue: (r) => r.name },
    { key: 'field', header: 'حوزه', align: 'center', sortValue: (r) => r.field },
    {
      key: 'employeeCount',
      header: 'کارکنان',
      align: 'center',
      sortValue: (r) => r.employeeCount,
      render: (r) => <span className="fa-nums">{nf(r.employeeCount)}</span>,
    },
    {
      key: 'areaM2',
      header: 'متراژ (م²)',
      align: 'center',
      sortValue: (r) => r.areaM2,
      render: (r) => <span className="fa-nums">{nf(r.areaM2)}</span>,
    },
    {
      key: 'maturityLevel',
      header: 'بلوغ',
      align: 'center',
      sortValue: (r) => r.maturityLevel,
      render: (r) => <span className="fa-nums">{nf(r.maturityLevel)}/۵</span>,
    },
    {
      key: 'establishmentDate',
      header: 'تأسیس',
      align: 'center',
      sortValue: (r) => r.establishmentDate,
      render: (r) => <span className="fa-nums">{jDateShort(r.establishmentDate)}</span>,
    },
    {
      key: 'flags',
      header: 'وضعیت',
      align: 'center',
      render: (r) => (
        <div className="flex flex-wrap justify-center gap-1">
          {r.isKnowledgeBased && <Badge tone="green">دانش‌بنیان</Badge>}
          {r.hasPatent && <Badge tone="blue">دارای اختراع</Badge>}
          {(debtByCompany.get(r.id) ?? 0) > 0 && <Badge tone="red">بدهکار</Badge>}
        </div>
      ),
    },
    {
      key: 'profit',
      header: 'سود خالص (تجمیعی)',
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
        title="شرکت‌های مستقر"
        subtitle="پروفایل کامل شرکت‌ها، وضعیت دانش‌بنیانی، اشغال فضا و عملکرد مالی"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل شرکت‌ها" value={c.length} icon={Building2} />
        <Kpi label="دانش‌بنیان" value={kb} unit={`(${pct((kb / c.length) * 100, 0)})`} icon={BadgeCheck} tone="gold" />
        <Kpi label="دارای ثبت اختراع" value={patents} icon={Layers} />
        <Kpi label="کل فضای اشغال‌شده" value={totalArea} unit="متر مربع" icon={Ruler} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartFrame title="ترکیب شرکت‌ها بر اساس حوزه فعالیت">
          <Donut data={fields} nameKey="name" valueKey="value" />
        </ChartFrame>
        <ChartFrame title="توزیع سطح بلوغ فناوری شرکت‌ها">
          <Bars data={maturity} xKey="level" series={[{ key: 'count', name: 'تعداد شرکت' }]} />
        </ChartFrame>
      </div>

      <div className="mt-4">
        <Card title="فهرست شرکت‌های مستقر">
          <DataTable columns={cols} rows={c} pageSize={15} initialSort={{ key: 'employeeCount', dir: 'desc' }} />
        </Card>
      </div>
    </div>
  )
}
