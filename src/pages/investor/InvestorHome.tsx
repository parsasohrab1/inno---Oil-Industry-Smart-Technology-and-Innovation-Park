import { useState } from 'react'
import clsx from 'clsx'
import { Rocket, HandCoins, Wallet, TrendingUp } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { api, ApiError } from '@/lib/api'
import { LoadingState, ErrorState } from '@/components/PageState'
import { PageHeader, Kpi, Card, Badge } from '@/components/ui'
import { DataTable, type Column } from '@/components/DataTable'
import { rial, usd, nf1 } from '@/lib/format'
import type { StartupEvaluation } from '@/lib/types'

interface Interest {
  id: string
  startupId: string
  startupName: string
  amountRial: number
  note: string
  status: string
  createdAt: string
}
interface Portfolio {
  interests: Interest[]
  portfolio: Array<Interest & { startup: StartupEvaluation | null }>
  totalCommittedRial: number
}

export default function InvestorHome() {
  const [tab, setTab] = useState<'browse' | 'portfolio'>('browse')
  const [minScore, setMinScore] = useState(0)
  const startups = useApi<StartupEvaluation[]>(`/api/investor/startups?minScore=${minScore}`)
  const portfolio = useApi<Portfolio>('/api/investor/interests')
  const [sel, setSel] = useState<StartupEvaluation | null>(null)
  const [amount, setAmount] = useState(2_000_000_000)
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const committed = new Set(
    (portfolio.data?.interests ?? []).filter((i) => i.status !== 'Withdrawn').map((i) => i.startupId),
  )

  async function express(e: React.FormEvent) {
    e.preventDefault()
    if (!sel) return
    setMsg(null)
    try {
      await api.post('/api/investor/interests', { startupId: sel.id, amountRial: Number(amount), note })
      setMsg(`Your interest in "${sel.teamName}" was recorded.`)
      setSel(null)
      setNote('')
      portfolio.reload()
    } catch (e2) {
      setMsg(e2 instanceof ApiError ? e2.message : 'Error recording')
    }
  }

  async function withdraw(id: string) {
    try {
      await api.post(`/api/investor/interests/${id}/withdraw`)
      portfolio.reload()
    } catch {
      setMsg('Error withdrawing')
    }
  }

  const cols: Column<StartupEvaluation>[] = [
    { key: 'teamName', header: 'Team', sortValue: (r) => r.teamName },
      { key: 'ideaTitle', header: 'Idea', sortValue: (r) => r.ideaTitle },
      {
        key: 'aiFinalScore',
        header: 'AI score',
        align: 'center',
        sortValue: (r) => r.aiFinalScore,
        render: (r) => <span className={clsx('fa-nums font-bold', r.aiFinalScore > 68 && 'text-petro-600')}>{nf1(r.aiFinalScore)}</span>,
      },
      {
        key: 'valuationRial',
        header: 'Valuation',
        align: 'end',
        sortValue: (r) => r.valuationRial,
        render: (r) => (
          <div className="text-end">
            <div className="fa-nums">{rial(r.valuationRial)}</div>
            <div className="fa-nums text-[11px] text-[rgb(var(--muted))]">≈ {usd(r.valuationUsd)}</div>
          </div>
        ),
      },
      {
        key: 'act',
        header: '',
        align: 'center',
        render: (r) =>
          committed.has(r.id) ? (
            <Badge tone="green">You expressed interest</Badge>
          ) : (
            <button className="btn btn-primary !py-1 !text-xs" onClick={() => setSel(r)}>
              Express interest
            </button>
          ),
      },
  ]

  if (startups.error) return <ErrorState error={startups.error} />

  return (
    <div>
      <PageHeader title="Investment desk" subtitle="Review evaluated startups, express interest and track the portfolio" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Startups available for review" value={startups.data?.length ?? 0} icon={Rocket} />
        <Kpi label="My expressions of interest" value={portfolio.data?.interests.filter((i) => i.status !== 'Withdrawn').length ?? 0} icon={HandCoins} tone="gold" />
        <Kpi label="Investment commitment" value={rial(portfolio.data?.totalCommittedRial ?? 0)} icon={Wallet} tone="brand" />
        <Kpi
          label="Average portfolio score"
          value={
            portfolio.data && portfolio.data.portfolio.length
              ? nf1(
                  portfolio.data.portfolio.reduce((s, p) => s + (p.startup?.aiFinalScore ?? 0), 0) /
                    portfolio.data.portfolio.length,
                )
              : '—'
          }
          icon={TrendingUp}
        />
      </div>

      {msg && <div className="mt-4 rounded-xl bg-petro-600/10 px-4 py-3 text-sm text-petro-700 dark:text-petro-300">{msg}</div>}

      <div className="my-4 flex flex-wrap items-center gap-2">
        <button className={clsx('rounded-xl border px-3 py-1.5 text-sm', tab === 'browse' && 'border-transparent bg-petro-600 text-white')} onClick={() => setTab('browse')}>
          Review startups
        </button>
        <button className={clsx('rounded-xl border px-3 py-1.5 text-sm', tab === 'portfolio' && 'border-transparent bg-petro-600 text-white')} onClick={() => setTab('portfolio')}>
          My portfolio ({portfolio.data?.portfolio.length ?? 0})
        </button>
        {tab === 'browse' && (
          <label className="ms-auto flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
            Minimum AI score:
            <input type="range" min={0} max={90} step={5} value={minScore} onChange={(e) => setMinScore(+e.target.value)} />
            <span className="fa-nums w-6">{minScore.toLocaleString('fa-IR')}</span>
          </label>
        )}
      </div>

      {tab === 'browse' && (
        <Card title="Evaluated startups">
          {startups.loading ? (
            <LoadingState />
          ) : (
            <DataTable columns={cols} rows={startups.data ?? []} pageSize={12} initialSort={{ key: 'aiFinalScore', dir: 'desc' }} />
          )}
        </Card>
      )}

      {tab === 'portfolio' && (
        <Card title="My investment portfolio">
          {portfolio.loading ? (
            <LoadingState />
          ) : (portfolio.data?.portfolio ?? []).length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">You have not yet expressed interest in any startup.</p>
          ) : (
            <ul className="space-y-3">
              {portfolio.data!.portfolio.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{p.startupName}</p>
                    <p className="fa-nums text-xs text-[rgb(var(--muted))]">
                      Commitment: {rial(p.amountRial)} · AI score: {p.startup ? nf1(p.startup.aiFinalScore) : '—'}
                    </p>
                    {p.note && <p className="text-xs text-[rgb(var(--muted))]">Note: {p.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={p.status === 'Withdrawn' ? 'gray' : 'blue'}>{p.status}</Badge>
                    {p.status !== 'Withdrawn' && (
                      <button className="btn !py-1 !text-xs" onClick={() => withdraw(p.id)}>
                        Withdraw
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {sel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setSel(null)}>
          <form
            className="w-full max-w-md space-y-3 rounded-2xl bg-[rgb(var(--surface))] p-5"
            onClick={(e) => e.stopPropagation()}
            onSubmit={express}
          >
            <h3 className="text-lg font-bold">Express interest in {sel.teamName}</h3>
            <p className="text-sm text-[rgb(var(--muted))]">{sel.ideaTitle}</p>
            <label className="block text-sm">
              <span className="mb-1 block text-[rgb(var(--muted))]">Proposed amount (rials)</span>
              <input type="number" min={100_000_000} step={100_000_000} className="inp fa-nums" value={amount} onChange={(e) => setAmount(+e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[rgb(var(--muted))]">Note (optional)</span>
              <textarea className="inp" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1 justify-center">Record interest</button>
              <button type="button" className="btn" onClick={() => setSel(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
