import { useMemo, useState } from 'react'
import { Boxes, Building2, Zap, Users } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { nf, pct, rial } from '@/lib/format'
import type { Company } from '@/lib/types'

interface Block {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
}

// چیدمان شماتیک پارک — بلوک‌های ساختمانی
const BLOCKS: Block[] = [
  { id: 'A', x: 20, y: 20, w: 150, h: 90, label: 'ساختمان نوآوری A' },
  { id: 'B', x: 190, y: 20, w: 150, h: 90, label: 'ساختمان فناوری B' },
  { id: 'C', x: 360, y: 20, w: 120, h: 90, label: 'مرکز رشد C' },
  { id: 'D', x: 20, y: 130, w: 110, h: 110, label: 'کارگاه‌های D' },
  { id: 'E', x: 150, y: 130, w: 190, h: 110, label: 'ساختمان مرکزی E' },
  { id: 'F', x: 360, y: 130, w: 120, h: 110, label: 'پاویون نوآوری F' },
  { id: 'G', x: 20, y: 260, w: 460, h: 60, label: 'محوطه باز و پارکینگ' },
]

export default function DigitalTwin() {
  const { data, loading, error } = useDataset()
  const [hover, setHover] = useState<string | null>(null)

  const groups = useMemo(() => {
    if (!data) return {}
    const map: Record<string, Company[]> = {}
    data.companies.forEach((c, i) => {
      const blk = BLOCKS[i % (BLOCKS.length - 1)] // به‌جز محوطه باز
      ;(map[blk.id] ??= []).push(c)
    })
    return map
  }, [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const now = Date.parse(data.generatedAt)
  const insideVehicles = data.vehicles.filter((v) => v.status === 'Inbound').length
  const occupancy = (data.companies.reduce((s, c) => s + c.areaM2, 0) / 60000) * 100
  const activeBookings = data.bookings.filter(
    (b) => Date.parse(b.startTime) <= now && Date.parse(b.endTime) >= now && b.status !== 'Cancelled',
  ).length

  const blockLoad = (id: string) => {
    const cs = groups[id] ?? []
    const emp = cs.reduce((s, c) => s + c.employeeCount, 0)
    return { count: cs.length, emp }
  }
  const maxEmp = Math.max(1, ...BLOCKS.map((b) => blockLoad(b.id).emp))

  const hoveredCompanies = hover ? (groups[hover] ?? []) : []

  return (
    <div>
      <PageHeader
        title="دوقلوی دیجیتال پارک"
        subtitle="نمای شماتیک پارک با داده‌های لحظه‌ای اشغال، تردد و مصرف"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="ضریب اشغال فضا" value={pct(occupancy)} icon={Building2} tone="gold" />
        <Kpi label="خودرو داخل پارک" value={insideVehicles} icon={Boxes} />
        <Kpi label="جلسات در حال برگزاری" value={activeBookings} icon={Users} tone="brand" />
        <Kpi label="بار مصرف برآوردی" value={pct(58 + occupancy / 8)} icon={Zap} tone="rust" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="نقشه شماتیک پارک — بار حرارتی نیروی انسانی">
          <svg viewBox="0 0 500 340" className="w-full">
            <rect x="0" y="0" width="500" height="340" fill="transparent" />
            {BLOCKS.map((b) => {
              const load = blockLoad(b.id)
              const intensity = b.id === 'G' ? 0.12 : load.emp / maxEmp
              return (
                <g
                  key={b.id}
                  onMouseEnter={() => setHover(b.id)}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx={10}
                    fill={`rgba(31,158,102,${0.15 + intensity * 0.6})`}
                    stroke={hover === b.id ? '#d4a24e' : 'rgb(var(--border))'}
                    strokeWidth={hover === b.id ? 3 : 1.5}
                  />
                  <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 6} textAnchor="middle" fontSize="11" fontFamily="Vazirmatn" fill="rgb(var(--text))">
                    {b.label}
                  </text>
                  {b.id !== 'G' && (
                    <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 12} textAnchor="middle" fontSize="10" fontFamily="Vazirmatn" fill="rgb(var(--muted))">
                      {nf(load.count)} شرکت · {nf(load.emp)} نفر
                    </text>
                  )}
                </g>
              )
            })}
            {/* گیت ورودی */}
            <rect x="230" y="322" width="40" height="12" rx={3} fill="#b4531f" />
            <text x="250" y="332" textAnchor="middle" fontSize="8" fontFamily="Vazirmatn" fill="#fff">
              گیت اصلی
            </text>
          </svg>
        </Card>

        <Card title={hover ? `شرکت‌های ${BLOCKS.find((b) => b.id === hover)?.label}` : 'جزئیات بلوک'}>
          {hoveredCompanies.length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              نشانگر را روی یک بلوک نگه دارید تا شرکت‌های مستقر آن نمایش داده شوند.
            </p>
          ) : (
            <ul className="space-y-2">
              {hoveredCompanies.slice(0, 10).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{c.name}</span>
                  <div className="flex shrink-0 gap-1">
                    {c.isKnowledgeBased && <Badge tone="green">دانش‌بنیان</Badge>}
                    <span className="fa-nums text-xs text-[rgb(var(--muted))]">{nf(c.areaM2)} م²</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card title="بیلان تجمیعی شرکت‌های مستقر (استخراج خودکار)">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="کل درآمد" value={rial(data.balanceSheets.reduce((s, b) => s + b.revenue, 0))} />
            <Metric label="کل سود خالص" value={rial(data.balanceSheets.reduce((s, b) => s + b.netProfit, 0))} />
            <Metric label="کل دارایی‌ها" value={rial(data.balanceSheets.reduce((s, b) => s + b.assets, 0))} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-[rgb(var(--muted))]">{label}</p>
      <p className="fa-nums mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}
