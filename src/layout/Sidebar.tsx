import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { X, Flame } from 'lucide-react'
import { NAV_GROUPS, navForRole } from '@/app/nav'
import { useUi } from '@/store/ui'
import { useAuth } from '@/store/auth'

export function Sidebar() {
  const { sidebarOpen, setSidebar } = useUi()
  const role = useAuth((s) => s.user?.role)
  const items = navForRole(role)

  return (
    <>
      {/* پوشش موبایل */}
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-black/40 lg:hidden',
          sidebarOpen ? 'block' : 'hidden',
        )}
        onClick={() => setSidebar(false)}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-40 w-72 border-s bg-[rgb(var(--surface))] transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-petro-600 text-white">
              <Flame className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold">پارک هوشمند نفت</div>
              <div className="text-[11px] text-[rgb(var(--muted))]">Naft Smart Park</div>
            </div>
          </div>
          <button
            className="btn !p-2 lg:hidden"
            onClick={() => setSidebar(false)}
            aria-label="بستن منو"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="h-[calc(100vh-4rem)] space-y-6 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.filter((group) => items.some((n) => n.group === group)).map((group) => (
            <div key={group}>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wide text-[rgb(var(--muted))]">
                {group}
              </div>
              <div className="space-y-1">
                {items
                  .filter((n) => n.group === group)
                  .map((item) => (
                    <NavLink
                      key={`${group}:${item.to}`}
                      to={item.to}
                      end={item.to === '/' || item.to === '/company'}
                      className={({ isActive }) => clsx('nav-link', isActive && 'nav-link-active')}
                      onClick={() => window.innerWidth < 1024 && setSidebar(false)}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
