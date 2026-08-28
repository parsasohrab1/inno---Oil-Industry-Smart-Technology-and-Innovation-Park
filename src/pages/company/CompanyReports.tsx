import { PageHeader } from '@/components/ui'
import { ReportsPanel } from '@/components/ReportsPanel'

export default function CompanyReports() {
  return (
    <div>
      <PageHeader title="گزارش‌های من" subtitle="گزارش‌های مالی و تأمین مالی مخصوص شرکت شما" />
      <ReportsPanel />
    </div>
  )
}
