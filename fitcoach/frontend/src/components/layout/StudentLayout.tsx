import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  CalendarCheck,
  ClipboardList,
  Home,
  Moon,
  Sun,
  TrendingUp,
  User,
} from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { InstallAppBanner } from '@/components/shared/InstallAppBanner'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { useTheme } from '@/components/shared/ThemeProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STUDENT_TABS = [
  { to: '/portal', label: 'Inicio', icon: Home, end: true },
  { to: '/portal/rutina', label: 'Mi Rutina', icon: ClipboardList },
  { to: '/portal/progreso', label: 'Progreso', icon: TrendingUp },
  { to: '/portal/sesiones', label: 'Sesiones', icon: CalendarCheck },
  { to: '/portal/perfil', label: 'Perfil', icon: User },
]

export function StudentLayout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-canvas text-ink pb-20">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Link to="/">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NotificationBell />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-brand-ink">
              LF
            </div>
          </div>
        </div>
      </header>

      {/* Main mobile-first area */}
      <main className="mx-auto max-w-xl px-4 py-5">
        <InstallAppBanner />
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav
        aria-label="Navegación del portal del alumno"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md"
      >
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5">
          {STUDENT_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    isActive ? 'text-brand-text font-semibold' : 'text-muted hover:text-ink',
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{tab.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
