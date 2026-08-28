import { Menu, Moon, Sun, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUi } from '@/store/ui'
import { useDataset } from '@/hooks/useDataset'
import { jDate } from '@/lib/format'

export function Header() {
  const { toggleSidebar, toggleTheme, theme } = useUi()
  const { data } = useDataset()
  const unread = data?.notifications.filter((n) => !n.read).length ?? 0

  return (
    <header className="sticky top-0 z-20 border-b bg-[rgb(var(--surface))]/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <button className="btn !p-2" onClick={toggleSidebar} aria-label="منو">
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-bold text-petro-700 dark:text-petro-300 sm:text-xl">
            به اولین پارک هوشمند کشور خوش آمدید
          </h1>
          <p className="hidden text-xs text-[rgb(var(--muted))] sm:block">
            {data ? `آخرین به‌روزرسانی داده: ${jDate(data.generatedAt)}` : 'در حال بارگذاری…'}
          </p>
        </div>

        <Link to="/notifications" className="btn relative !p-2" aria-label="نوتیفیکیشن‌ها">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full bg-oil-rust px-1 text-[10px] font-bold text-white">
              {unread > 99 ? '۹۹+' : unread.toLocaleString('fa-IR')}
            </span>
          )}
        </Link>

        <button className="btn !p-2" onClick={toggleTheme} aria-label="تغییر پوسته">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  )
}
