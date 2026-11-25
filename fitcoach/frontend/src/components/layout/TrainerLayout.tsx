import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Dumbbell,
  ExternalLink,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { useTheme } from '@/components/shared/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { apiRequest } from '@/lib/api'
import { BRAND_CONFIG } from '@/lib/brand.config'
import { cn } from '@/lib/utils'

interface TrainerNotificationItem {
  id: string
  type: 'LEAD' | 'PAYMENT' | 'WORKOUT' | 'APPOINTMENT'
  severity: 'info' | 'warning' | 'urgent'
  title: string
  description: string
  createdAt: string
  href: string
}

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

const TRAINER_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Principal',
    items: [
      { to: '/trainer', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/trainer/calendario', label: 'Calendario', icon: Calendar },
    ],
  },
  {
    group: 'Entrenamiento',
    items: [
      { to: '/trainer/alumnos', label: 'Alumnos', icon: Users },
      { to: '/trainer/ejercicios', label: 'Ejercicios', icon: Dumbbell },
      { to: '/trainer/rutinas', label: 'Constructor de rutinas', icon: Layers },
    ],
  },
  {
    group: 'Negocio',
    items: [
      { to: '/trainer/pagos', label: 'Pagos', icon: CreditCard },
      { to: '/trainer/consultas', label: 'Consultas', icon: MessageSquare },
      { to: '/trainer/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
]

export function TrainerLayout() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const notifRef = React.useRef<HTMLDivElement>(null)

  const notifQuery = useQuery({
    queryKey: ['trainer-notifications'],
    queryFn: () =>
      apiRequest<{ items: TrainerNotificationItem[]; unreadCount: number }>(
        '/notifications',
      ),
    refetchInterval: 60_000,
  })

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const renderNav = (isCompact: boolean, onNavigate?: () => void) => (
    <nav aria-label="Navegación del panel" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {TRAINER_NAV.map((section) => (
        <div key={section.group}>
          {!isCompact && (
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              {section.group}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  title={isCompact ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isCompact && 'justify-center px-2',
                      isActive
                        ? 'bg-brand text-brand-ink font-semibold'
                        : 'text-muted hover:bg-elevated hover:text-ink',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!isCompact && <span className="truncate">{item.label}</span>}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden border-r border-line bg-surface transition-[width] duration-200 lg:flex lg:flex-col',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Link to="/" className="overflow-hidden">
            <BrandLogo compact={collapsed} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {renderNav(collapsed)}

        <div className="border-t border-line p-3">
          <Link
            to="/"
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-ink',
              collapsed && 'justify-center px-2',
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Ver landing pública</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex w-72 flex-col border-r border-line bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <BrandLogo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {renderNav(false, () => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú lateral"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden w-72 sm:block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Buscar alumno o rutina..."
                className="h-9 pl-9 text-xs"
                aria-label="Buscar alumno o rutina"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notificaciones"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {(notifQuery.data?.unreadCount ?? 0) > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-ink">
                    {notifQuery.data!.unreadCount > 9 ? '9+' : notifQuery.data!.unreadCount}
                  </span>
                )}
              </Button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Notificaciones</p>
                      <p className="text-[11px] text-muted">
                        Alertas en tiempo real de tu gimnasio
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => void notifQuery.refetch()}
                      aria-label="Actualizar notificaciones"
                      title="Actualizar"
                    >
                      <RefreshCw
                        className={cn(
                          'h-3.5 w-3.5',
                          notifQuery.isFetching && 'animate-spin',
                        )}
                      />
                    </Button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-line">
                    {notifQuery.isLoading ? (
                      <div className="p-4 text-center text-xs text-muted">
                        Cargando alertas...
                      </div>
                    ) : !notifQuery.data?.items.length ? (
                      <div className="p-6 text-center text-xs text-muted">
                        ¡Todo al día! No tenés alertas pendientes.
                      </div>
                    ) : (
                      notifQuery.data.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false)
                            navigate(item.href)
                          }}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated"
                        >
                          <span
                            className={cn(
                              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                              item.severity === 'urgent'
                                ? 'bg-danger'
                                : item.severity === 'warning'
                                  ? 'bg-amber-400'
                                  : 'bg-brand',
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-ink">
                              {item.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-muted">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5 border-l border-line pl-3">
              <img
                src="/images/coach-portrait.jpg"
                alt={user?.fullName ?? BRAND_CONFIG.trainer.fullName}
                className="h-9 w-9 rounded-full border border-line object-cover"
              />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-tight text-ink">
                  {user?.fullName ?? BRAND_CONFIG.trainer.fullName}
                </p>
                <p className="text-[11px] text-muted">Entrenador</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
