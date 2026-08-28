import type { ReactElement, ReactNode } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { nf } from '@/lib/format'
import { CHART_COLORS } from '@/lib/chart-colors'

const axisProps = {
  tick: { fontSize: 11, fill: 'rgb(var(--muted))', fontFamily: 'Vazirmatn' },
  axisLine: { stroke: 'rgb(var(--border))' },
  tickLine: false,
} as const

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid rgb(var(--border))',
    background: 'rgb(var(--surface))',
    fontFamily: 'Vazirmatn',
    fontSize: 12,
    direction: 'rtl' as const,
  },
  labelStyle: { color: 'rgb(var(--text))', fontWeight: 700 },
}

export function ChartFrame({
  title,
  subtitle,
  children,
  height = 300,
  action,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  height?: number
  action?: ReactNode
}) {
  return (
    <section className="card">
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          {subtitle && <p className="text-xs text-[rgb(var(--muted))]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-2 py-3 sm:px-3" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as ReactElement}
        </ResponsiveContainer>
      </div>
    </section>
  )
}

interface Series {
  key: string
  name: string
  color?: string
}

export function Bars({
  data,
  xKey,
  series,
  stacked,
  format = nf,
}: {
  data: Array<Record<string, unknown>>
  xKey: string
  series: Series[]
  stacked?: boolean
  format?: (n: number) => string
}) {
  return (
    <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
      <XAxis dataKey={xKey} reversed {...axisProps} />
      <YAxis orientation="right" tickFormatter={(v) => format(Number(v))} {...axisProps} width={64} />
      <Tooltip {...tooltipStyle} formatter={(v) => format(Number(v))} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Vazirmatn' }} />}
      {series.map((s, i) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.name}
          stackId={stacked ? 'a' : undefined}
          fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
          radius={stacked ? 0 : [6, 6, 0, 0]}
          maxBarSize={44}
        />
      ))}
    </BarChart>
  )
}

export function Lines({
  data,
  xKey,
  series,
  format = nf,
  area,
}: {
  data: Array<Record<string, unknown>>
  xKey: string
  series: Series[]
  format?: (n: number) => string
  area?: boolean
}) {
  const shared = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
      <XAxis dataKey={xKey} reversed {...axisProps} />
      <YAxis orientation="right" tickFormatter={(v) => format(Number(v))} {...axisProps} width={64} />
      <Tooltip {...tooltipStyle} formatter={(v) => format(Number(v))} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Vazirmatn' }} />}
    </>
  )
  const margin = { top: 8, right: 8, left: 8, bottom: 4 }

  if (area) {
    return (
      <AreaChart data={data} margin={margin}>
        {shared}
        {series.map((s, i) => {
          const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          )
        })}
      </AreaChart>
    )
  }

  return (
    <LineChart data={data} margin={margin}>
      {shared}
      {series.map((s, i) => {
        const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
        return (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        )
      })}
    </LineChart>
  )
}

export function Donut({
  data,
  nameKey,
  valueKey,
  format = nf,
}: {
  data: Array<Record<string, unknown>>
  nameKey: string
  valueKey: string
  format?: (n: number) => string
}) {
  return (
    <PieChart>
      <Tooltip {...tooltipStyle} formatter={(v) => format(Number(v))} />
      <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Vazirmatn' }} />
      <Pie
        data={data}
        dataKey={valueKey}
        nameKey={nameKey}
        cx="50%"
        cy="50%"
        innerRadius="55%"
        outerRadius="85%"
        paddingAngle={2}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  )
}

export function RadarBox({
  data,
  angleKey,
  series,
}: {
  data: Array<Record<string, unknown>>
  angleKey: string
  series: Series[]
}) {
  return (
    <RadarChart data={data} outerRadius="75%">
      <PolarGrid stroke="rgb(var(--border))" />
      <PolarAngleAxis dataKey={angleKey} tick={{ fontSize: 11, fill: 'rgb(var(--muted))', fontFamily: 'Vazirmatn' }} />
      <PolarRadiusAxis tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} />
      <Tooltip {...tooltipStyle} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Vazirmatn' }} />}
      {series.map((s, i) => {
        const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length]
        return (
          <Radar key={s.key} dataKey={s.key} name={s.name} stroke={color} fill={color} fillOpacity={0.2} />
        )
      })}
    </RadarChart>
  )
}
