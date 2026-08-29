import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUi } from '@/store/ui'
import clsx from 'clsx'

export function AppShell() {
  const sidebarOpen = useUi((s) => s.sidebarOpen)

  return (
    <div className="min-h-full bg-[rgb(var(--bg))]">
      <Sidebar />
      <div
        className={clsx(
          'flex min-h-screen flex-col transition-[padding] duration-200',
          sidebarOpen ? 'lg:pe-72' : 'lg:pe-0',
        )}
      >
        <Header />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-[1400px] px-4 pb-6 pt-2 text-center text-xs text-[rgb(var(--muted))] sm:px-6">
          سامانه مدیریت یکپارچه پارک هوشمند نفت (OIPMS) — نسخه ۰٫۱ · داده‌ها سنتتیک و صرفاً برای نمایش است
        </footer>
      </div>
    </div>
  )
}
