import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Coins,
  ShieldAlert,
  GraduationCap,
  CalendarDays,
  Rocket,
  BadgeCheck,
} from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge, ProgressBar } from '@/components/ui'
import { ChartFrame, Bars, Donut } from '@/components/charts'
import {
  overviewKpis,
  rentByPeriod,
  companiesByField,
  debtors,
  fundingFunnel,
  mentoringByArea,
} from '@/services/analytics'
import { rial, nf, pct, relTime } from '@/lib/format'

export default function Overview() {
  const { data, loading, error } = useDataset()
  const k = useMemo(() => (data ? overviewKpis(data) : null), [data])

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data || !k) return null

  const rentSeries = rentByPeriod(data).map((r) => ({
    period: r.period,
    'Invoiced (billion rials)': +(r.billed / 1e9).toFixed(1),
    'Collected (billion rials)': +(r.collected / 1e9).toFixed(1),
  }))
  const fields = companiesByField(data).map((f) => ({ name: f.field, value: f.count }))
  const topDebtors = debtors(data).slice(0, 6)
  const funnel = fundingFunnel(data)
  const mentoring = mentoringByArea(data)
  const recentNotes = data.notifications.slice(0, 6)

  return (
    <div>
      <PageHeader
        title="Park overview"
        subtitle="Real-time status of operations, finance, investment and development of resident companies"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Kpi label="Resident companies" value={k.companies} icon={Building2} />
        <Kpi label="Knowledge-based share" value={pct(k.knowledgeBasedShare)} icon={BadgeCheck} tone="gold" />
        <Kpi label="Companies' workforce" value={k.totalWorkforce} unit="people" icon={Users} />
        <Kpi label="Park operators" value={k.operators} unit="people" icon={Users} tone="neutral" />
        <Kpi
          label="Monthly rent"
          value={`${nf(k.monthlyRentBillun)} billion rials`}
          icon={Coins}
          tone="gold"
        />
        <Kpi label="Receivables collection rate" value={pct(k.collectionRate)} icon={Coins} />
        <Kpi label="Companies in arrears" value={k.overdueCompanies} icon={ShieldAlert} tone="rust" />
        <Kpi label="Critical alerts" value={k.criticalAlerts} icon={ShieldAlert} tone="rust" />
        <Kpi label="Active mentoring" value={k.activeMentoring} icon={GraduationCap} />
        <Kpi label="Upcoming events" value={k.upcomingEvents} icon={CalendarDays} />
        <Kpi label="Recommended startups" value={k.startupsRecommended} icon={Rocket} tone="gold" />
        <Kpi label="Approved financing" value={rial(k.approvedFundingRial)} icon={Coins} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartFrame
            title="Invoice and rent collection trend"
            subtitle="Billion rials — by period"
          >
            <Bars
              data={rentSeries}
              xKey="period"
              series={[
                { key: 'Invoiced (billion rials)', name: 'Invoiced' },
                { key: 'Collected (billion rials)', name: 'Collected', color: '#d4a24e' },
              ]}
            />
          </ChartFrame>
        </div>
        <ChartFrame title="Company mix by field of activity" height={300}>
          <Donut data={fields} nameKey="name" valueKey="value" />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          title="Largest rent debtors"
          action={
            <Link to="/finance" className="text-xs text-petro-600 hover:underline">
              View all
            </Link>
          }
        >
          <ul className="space-y-3">
            {topDebtors.map((d) => (
              <li key={d.companyId} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.companyName}</p>
                  <p className="fa-nums text-xs text-[rgb(var(--muted))]">
                    {nf(d.months)} months overdue · {rial(d.amount)}
                  </p>
                </div>
                {d.gateRevoked ? (
                  <Badge tone="red">Gate blocked</Badge>
                ) : (
                  <Badge tone="amber">Reminder</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Fundraising funnel"
          action={
            <Link to="/investment" className="text-xs text-petro-600 hover:underline">
              Details
            </Link>
          }
        >
          <ul className="space-y-3">
            {funnel.map((f) => (
              <li key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{f.stage}</span>
                  <span className="fa-nums text-[rgb(var(--muted))]">{nf(f.count)} requests</span>
                </div>
                <ProgressBar
                  value={(f.count / Math.max(...funnel.map((x) => x.count))) * 100}
                  tone={f.stage === 'Rejected' ? 'rust' : f.stage === 'Approved' ? 'brand' : 'gold'}
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Latest notifications"
          action={
            <Link to="/notifications" className="text-xs text-petro-600 hover:underline">
              All
            </Link>
          }
        >
          <ul className="space-y-3">
            {recentNotes.map((n) => (
              <li key={n.id} className="flex gap-2">
                <span
                  className={
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full ' +
                    (n.severity === 'critical'
                      ? 'bg-oil-rust'
                      : n.severity === 'warning'
                        ? 'bg-oil-gold'
                        : n.severity === 'success'
                          ? 'bg-petro-500'
                          : 'bg-sky-500')
                  }
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="truncate text-xs text-[rgb(var(--muted))]">{n.body}</p>
                  <p className="fa-nums text-[11px] text-[rgb(var(--muted))]">{relTime(n.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Mentoring progress by area">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentoring.map((m) => (
              <div key={m.area}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{m.area}</span>
                  <span className="fa-nums text-xs text-[rgb(var(--muted))]">
                    {pct(m.avgProgress, 0)}
                  </span>
                </div>
                <ProgressBar value={m.avgProgress} />
                <p className="fa-nums mt-1 text-xs text-[rgb(var(--muted))]">
                  {nf(m.active)} active · {nf(m.completed)} completed of {nf(m.total)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
