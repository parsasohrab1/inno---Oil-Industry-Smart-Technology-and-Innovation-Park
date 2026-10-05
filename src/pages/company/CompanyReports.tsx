import { PageHeader } from '@/components/ui'
import { ReportsPanel } from '@/components/ReportsPanel'

export default function CompanyReports() {
  return (
    <div>
      <PageHeader title="My reports" subtitle="Financial and financing reports specific to your company" />
      <ReportsPanel />
    </div>
  )
}
