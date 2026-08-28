import { Menu, Moon, Sun, LogOut } from 'lucide-react'
import { useUi } from '@/store/ui'
import { useAuth, type Role } from '@/store/auth'

const ROLE_LABEL: Record<Role, string> = {
  admin: 'مدیر پارک',
  operator: 'اپراتور',
  company: 'مدیر شرکت',
  startup: 'استارتاپ',
  investor: 'سرمایه‌گذار',
  mentor: 'منتور',
}

export function Header() {
  const { toggleSidebar, toggleTheme, theme } = useUi()
  const { user, logout } = useAuth()

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
        </div>

        {user && (
          <div className="hidden items-center gap-2 rounded-xl border px-3 py-1.5 text-sm sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-petro-600/15 text-xs font-bold text-petro-700 dark:text-petro-300">
              {user.name.slice(0, 1)}
            </span>
            <div className="leading-tight">
              <div className="font-medium">{user.name}</div>
              <div className="text-[11px] text-[rgb(var(--muted))]">{ROLE_LABEL[user.role]}</div>
            </div>
          </div>
        )}

        <button className="btn !p-2" onClick={toggleTheme} aria-label="تغییر پوسته">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button className="btn !p-2" onClick={logout} aria-label="خروج" title="خروج">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
