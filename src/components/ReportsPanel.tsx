import { useState } from 'react'
import { FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { downloadFile, openPrintable } from '@/lib/api'
import { LoadingState, ErrorState } from '@/components/PageState'
import { Card, Badge } from '@/components/ui'

interface ReportMeta {
  id: string
  title: string
  scope: 'all' | 'own'
  formats: string[]
}

export function ReportsPanel() {
  const { data, loading, error } = useApi<ReportMeta[]>('/api/reports')
  const [busy, setBusy] = useState<string | null>(null)

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  async function run(id: string, format: 'html' | 'csv' | 'xlsx') {
    setBusy(`${id}:${format}`)
    try {
      if (format === 'html') await openPrintable(`/api/reports/${id}.html`)
      else await downloadFile(`/api/reports/${id}.${format}`, `${id}.${format}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(data ?? []).map((r) => (
        <Card key={r.id} title={r.title}>
          <div className="mb-3">
            <Badge tone={r.scope === 'all' ? 'blue' : 'green'}>
              {r.scope === 'all' ? 'کل پارک' : 'مخصوص شرکت شما'}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn !text-xs" disabled={busy === `${r.id}:html`} onClick={() => run(r.id, 'html')}>
              <Printer className="h-3.5 w-3.5" /> چاپ / PDF
            </button>
            <button className="btn !text-xs" disabled={busy === `${r.id}:xlsx`} onClick={() => run(r.id, 'xlsx')}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </button>
            <button className="btn !text-xs" disabled={busy === `${r.id}:csv`} onClick={() => run(r.id, 'csv')}>
              <FileText className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
