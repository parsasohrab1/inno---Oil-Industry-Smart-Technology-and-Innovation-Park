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
    'صورتحساب (میلیارد ریال)': +(r.billed / 1e9).toFixed(1),
    'وصول‌شده (میلیارد ریال)': +(r.collected / 1e9).toFixed(1),
  }))
  const fields = companiesByField(data).map((f) => ({ name: f.field, value: f.count }))
  const topDebtors = debtors(data).slice(0, 6)
  const funnel = fundingFunnel(data)
  const mentoring = mentoringByArea(data)
  const recentNotes = data.notifications.slice(0, 6)

  return (
    <div>
      <PageHeader
        title="نمای کلی پارک"
        subtitle="وضعیت لحظه‌ای عملیات، مالی، سرمایه‌گذاری و توسعه شرکت‌های مستقر"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <Kpi label="شرکت‌های مستقر" value={k.companies} icon={Building2} />
        <Kpi label="سهم دانش‌بنیان" value={pct(k.knowledgeBasedShare)} icon={BadgeCheck} tone="gold" />
        <Kpi label="نیروی انسانی شرکت‌ها" value={k.totalWorkforce} unit="نفر" icon={Users} />
        <Kpi label="اپراتور پارک" value={k.operators} unit="نفر" icon={Users} tone="neutral" />
        <Kpi
          label="اجاره‌بهای ماهانه"
          value={`${nf(k.monthlyRentBillun)} میلیارد ریال`}
          icon={Coins}
          tone="gold"
        />
        <Kpi label="نرخ وصول مطالبات" value={pct(k.collectionRate)} icon={Coins} />
        <Kpi label="شرکت‌های بدهکار" value={k.overdueCompanies} icon={ShieldAlert} tone="rust" />
        <Kpi label="هشدارهای بحرانی" value={k.criticalAlerts} icon={ShieldAlert} tone="rust" />
        <Kpi label="منتورینگ فعال" value={k.activeMentoring} icon={GraduationCap} />
        <Kpi label="رویدادهای پیش‌رو" value={k.upcomingEvents} icon={CalendarDays} />
        <Kpi label="استارت‌آپ توصیه‌شده" value={k.startupsRecommended} icon={Rocket} tone="gold" />
        <Kpi label="تأمین مالی مصوب" value={rial(k.approvedFundingRial)} icon={Coins} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartFrame
            title="روند صورتحساب و وصول اجاره‌بها"
            subtitle="میلیارد ریال — به تفکیک دوره"
          >
            <Bars
              data={rentSeries}
              xKey="period"
              series={[
                { key: 'صورتحساب (میلیارد ریال)', name: 'صورتحساب' },
                { key: 'وصول‌شده (میلیارد ریال)', name: 'وصول‌شده', color: '#d4a24e' },
              ]}
            />
          </ChartFrame>
        </div>
        <ChartFrame title="ترکیب شرکت‌ها بر اساس حوزه فعالیت" height={300}>
          <Donut data={fields} nameKey="name" valueKey="value" />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card
          title="بزرگ‌ترین بدهکاران اجاره‌بها"
          action={
            <Link to="/finance" className="text-xs text-petro-600 hover:underline">
              مشاهده همه
            </Link>
          }
        >
          <ul className="space-y-3">
            {topDebtors.map((d) => (
              <li key={d.companyId} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.companyName}</p>
                  <p className="fa-nums text-xs text-[rgb(var(--muted))]">
                    {nf(d.months)} ماه معوقه · {rial(d.amount)}
                  </p>
                </div>
                {d.gateRevoked ? (
                  <Badge tone="red">گیت مسدود</Badge>
                ) : (
                  <Badge tone="amber">تذکر</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="قیف جذب سرمایه"
          action={
            <Link to="/investment" className="text-xs text-petro-600 hover:underline">
              جزئیات
            </Link>
          }
        >
          <ul className="space-y-3">
            {funnel.map((f) => (
              <li key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{f.stage}</span>
                  <span className="fa-nums text-[rgb(var(--muted))]">{nf(f.count)} درخواست</span>
                </div>
                <ProgressBar
                  value={(f.count / Math.max(...funnel.map((x) => x.count))) * 100}
                  tone={f.stage === 'رد شده' ? 'rust' : f.stage === 'مصوب' ? 'brand' : 'gold'}
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="آخرین نوتیفیکیشن‌ها"
          action={
            <Link to="/notifications" className="text-xs text-petro-600 hover:underline">
              همه
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
        <Card title="پیشرفت منتورینگ بر اساس حوزه">
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
                  {nf(m.active)} فعال · {nf(m.completed)} تکمیل‌شده از {nf(m.total)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
