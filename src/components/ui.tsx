import type { ReactNode } from 'react'
import clsx from 'clsx'
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { nf, pct } from '@/lib/format'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[rgb(var(--muted))]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode
  className?: string
  title?: ReactNode
  action?: ReactNode
}) {
  return (
    <section className={clsx('card', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
          <h3 className="text-sm font-bold">{title}</h3>
          {action}
        </div>
      )}
      <div className="card-pad">{children}</div>
    </section>
  )
}

export function Kpi({
  label,
  value,
  unit,
  delta,
  icon: Icon,
  tone = 'brand',
}: {
  label: string
  value: string | number
  unit?: string
  delta?: number
  icon?: LucideIcon
  tone?: 'brand' | 'gold' | 'rust' | 'neutral'
}) {
  const toneMap = {
    brand: 'text-petro-600 bg-petro-600/10',
    gold: 'text-oil-gold bg-oil-gold/10',
    rust: 'text-oil-rust bg-oil-rust/10',
    neutral: 'text-[rgb(var(--muted))] bg-black/5 dark:bg-white/5',
  }
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <span className="text-sm text-[rgb(var(--muted))]">{label}</span>
        {Icon && (
          <span className={clsx('grid h-8 w-8 place-items-center rounded-lg', toneMap[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="fa-nums text-2xl font-bold">
          {typeof value === 'number' ? nf(value) : value}
        </span>
        {unit && <span className="text-xs text-[rgb(var(--muted))]">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div
          className={clsx(
            'mt-1 flex items-center gap-1 text-xs',
            delta >= 0 ? 'text-petro-600' : 'text-oil-rust',
          )}
        >
          {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span className="fa-nums">{pct(Math.abs(delta))}</span>
          <span className="text-[rgb(var(--muted))]">نسبت به دوره قبل</span>
        </div>
      )}
    </div>
  )
}

const BADGE_TONES: Record<string, string> = {
  green: 'bg-petro-600/10 text-petro-700 dark:text-petro-300',
  amber: 'bg-oil-gold/15 text-oil-amber',
  red: 'bg-oil-rust/10 text-oil-rust',
  gray: 'bg-black/5 text-[rgb(var(--muted))] dark:bg-white/10',
  blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
}

export function Badge({ tone = 'gray', children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return <span className={clsx('chip', BADGE_TONES[tone])}>{children}</span>
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'gold' | 'rust' }) {
  const bar = { brand: 'bg-petro-500', gold: 'bg-oil-gold', rust: 'bg-oil-rust' }[tone]
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
      <div className={clsx('h-full rounded-full', bar)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed py-12 text-sm text-[rgb(var(--muted))]">
      {message}
    </div>
  )
}
