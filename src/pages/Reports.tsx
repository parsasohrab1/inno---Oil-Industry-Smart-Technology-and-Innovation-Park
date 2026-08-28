import { PageHeader } from '@/components/ui'
import { ReportsPanel } from '@/components/ReportsPanel'

export default function Reports() {
  return (
    <div>
      <PageHeader
        title="گزارش‌گیری"
        subtitle="خروجی گزارش‌ها در قالب Excel، CSV و نسخه قابل چاپ (PDF از طریق مرورگر)"
      />
      <ReportsPanel />
    </div>
  )
}
