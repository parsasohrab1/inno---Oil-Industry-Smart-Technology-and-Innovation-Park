import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Bell, ShieldAlert, Coins, CalendarDays, Cpu } from 'lucide-react'
import { useDataset } from '@/hooks/useDataset'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { relTime, jDateTime } from '@/lib/format'
import type { Notification } from '@/lib/types'

const SEVERITY: Record<Notification['severity'], { tone: 'red' | 'amber' | 'green' | 'blue'; label: string }> = {
  critical: { tone: 'red', label: 'بحرانی' },
  warning: { tone: 'amber', label: 'هشدار' },
  success: { tone: 'green', label: 'موفق' },
  info: { tone: 'blue', label: 'اطلاع' },
}

const CAT_ICON: Record<Notification['category'], typeof Bell> = {
  مالی: Coins,
  امنیتی: ShieldAlert,
  رویداد: CalendarDays,
  سرمایه‌گذاری: Coins,
  منتورینگ: Bell,
  سیستمی: Cpu,
}

export default function Notifications() {
  const { data, loading, error } = useDataset()
  const [cat, setCat] = useState<Notification['category'] | 'همه'>('همه')

  const cats = useMemo(
    () => (data ? [...new Set(data.notifications.map((n) => n.category))] : []),
    [data],
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  const all = data.notifications
  const list = cat === 'همه' ? all : all.filter((n) => n.category === cat)
  const unread = all.filter((n) => !n.read).length
  const critical = all.filter((n) => n.severity === 'critical').length

  return (
    <div>
      <PageHeader
        title="نوتیفیکیشن‌های هوشمند"
        subtitle="اعلان‌های خودکار برای اپراتورها و شرکت‌ها — مالی، امنیتی، رویداد و سرمایه‌گذاری"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="کل نوتیفیکیشن‌ها" value={all.length} icon={Bell} />
        <Kpi label="خوانده‌نشده" value={unread} icon={Bell} tone="gold" />
        <Kpi label="بحرانی" value={critical} icon={ShieldAlert} tone="rust" />
        <Kpi label="دسته‌ها" value={cats.length} icon={Cpu} tone="neutral" />
      </div>

      <div className="my-4 flex flex-wrap gap-2">
        {(['همه', ...cats] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={clsx(
              'rounded-xl border px-3 py-1.5 text-sm',
              cat === c ? 'border-transparent bg-petro-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <Card>
        <ul className="divide-y">
          {list.map((n) => {
            const Icon = CAT_ICON[n.category] ?? Bell
            const sev = SEVERITY[n.severity]
            return (
              <li key={n.id} className={clsx('flex gap-3 py-3', !n.read && 'font-medium')}>
                <span
                  className={clsx(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                    sev.tone === 'red'
                      ? 'bg-oil-rust/10 text-oil-rust'
                      : sev.tone === 'amber'
                        ? 'bg-oil-gold/15 text-oil-amber'
                        : sev.tone === 'green'
                          ? 'bg-petro-600/10 text-petro-600'
                          : 'bg-sky-500/10 text-sky-600',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">{n.title}</span>
                    <Badge tone={sev.tone}>{sev.label}</Badge>
                    <Badge tone="gray">{n.category}</Badge>
                    <Badge tone="gray">{n.audience}</Badge>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-oil-rust" />}
                  </div>
                  <p className="mt-0.5 text-sm text-[rgb(var(--muted))]">{n.body}</p>
                  <p className="fa-nums mt-0.5 text-[11px] text-[rgb(var(--muted))]" title={jDateTime(n.createdAt)}>
                    {relTime(n.createdAt)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
