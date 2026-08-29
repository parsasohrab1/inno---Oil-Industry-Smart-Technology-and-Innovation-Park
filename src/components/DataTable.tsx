import { useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { EmptyState } from './ui'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sortValue?: (row: T) => number | string
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  pageSize = 12,
  emptyMessage = 'رکوردی برای نمایش وجود ندارد',
  initialSort,
}: {
  columns: Column<T>[]
  rows: T[]
  pageSize?: number
  emptyMessage?: string
  initialSort?: { key: string; dir: 'asc' | 'desc' }
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'fa') * dir
    })
  }, [rows, sort, columns])

  const pageCount = Math.ceil(sorted.length / pageSize)
  const visible = sorted.slice(page * pageSize, page * pageSize + pageSize)

  if (rows.length === 0) return <EmptyState message={emptyMessage} />

  function toggleSort(key: string) {
    setPage(0)
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-[rgb(var(--muted))]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={clsx(
                    'whitespace-nowrap px-3 py-2.5 font-medium',
                    c.align === 'end' ? 'text-end' : c.align === 'center' ? 'text-center' : 'text-start',
                  )}
                >
                  {c.sortValue ? (
                    <button
                      className="inline-flex items-center gap-1 hover:text-[rgb(var(--text))]"
                      onClick={() => toggleSort(c.key)}
                    >
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx(
                      'px-3 py-2.5',
                      c.align === 'end' ? 'text-end' : c.align === 'center' ? 'text-center' : 'text-start',
                      c.className,
                    )}
                  >
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-[rgb(var(--muted))]">
          <span className="fa-nums">
            {(page * pageSize + 1).toLocaleString('fa-IR')}–
            {Math.min((page + 1) * pageSize, sorted.length).toLocaleString('fa-IR')} از{' '}
            {sorted.length.toLocaleString('fa-IR')}
          </span>
          <div className="flex gap-1">
            <button
              className="btn !px-2 !py-1 disabled:opacity-40"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              قبلی
            </button>
            <button
              className="btn !px-2 !py-1 disabled:opacity-40"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              بعدی
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
