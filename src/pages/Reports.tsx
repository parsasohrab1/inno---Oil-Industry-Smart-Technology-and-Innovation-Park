import { PageHeader } from '@/components/ui'
import { ReportsPanel } from '@/components/ReportsPanel'

export default function Reports() {
  return (
    <div>
      <PageHeader
        title="Reporting"
        subtitle="Report output in Excel, CSV and a printable version (PDF through the browser)"
      />
      <ReportsPanel />
    </div>
  )
}
