import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, CheckCheck, RefreshCw, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface NotificationItem {
  id: string
  type: 'LEAD' | 'PAYMENT' | 'WORKOUT' | 'APPOINTMENT'
  severity: 'info' | 'warning' | 'urgent'
  title: string
  description: string
  createdAt: string
  href: string
}

function loadDismissedIds(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDismissedIds(storageKey: string, ids: string[]) {
  try {
    // Mantiene las últimas 200 para evitar crecimiento indefinido
    localStorage.setItem(storageKey, JSON.stringify(ids.slice(-200)))
  } catch {}
}

export function NotificationBell() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const storageKey = `fitcoach_dismissed_notifs_${user?.id ?? 'anon'}`

  const [open, setOpen] = React.useState(false)
  const [dismissedIds, setDismissedIds] = React.useState<string[]>(() =>
    loadDismissedIds(storageKey),
  )
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setDismissedIds(loadDismissedIds(storageKey))
  }, [storageKey])

  const notifQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () =>
      apiRequest<{ items: NotificationItem[]; unreadCount: number }>(
        '/notifications',
      ),
    enabled: Boolean(user),
    refetchInterval: 60_000,
  })

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const visibleItems = React.useMemo(() => {
    const rawItems = notifQuery.data?.items ?? []
    const dismissedSet = new Set(dismissedIds)
    return rawItems.filter((item) => !dismissedSet.has(item.id))
  }, [notifQuery.data?.items, dismissedIds])

  const dismissOne = (id: string) => {
    setDismissedIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveDismissedIds(storageKey, next)
      return next
    })
  }

  const dismissAll = () => {
    const allIds = visibleItems.map((i) => i.id)
    if (!allIds.length) return
    setDismissedIds((prev) => {
      const next = Array.from(new Set([...prev, ...allIds]))
      saveDismissedIds(storageKey, next)
      return next
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notificaciones"
        onClick={() => setOpen((o) => !o)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {visibleItems.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-ink">
            {visibleItems.length > 9 ? '9+' : visibleItems.length}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Notificaciones</p>
              <p className="text-[11px] text-muted">
                Se quitan automáticamente al verlas
              </p>
            </div>
            <div className="flex items-center gap-1">
              {visibleItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-muted hover:text-ink"
                  onClick={dismissAll}
                  title="Marcar todas como vistas"
                >
                  <CheckCheck className="mr-1 h-3.5 w-3.5" />
                  Limpiar
                </Button>
              )}
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
          </div>

          <div className="max-h-80 divide-y divide-line overflow-y-auto">
            {notifQuery.isLoading ? (
              <div className="p-4 text-center text-xs text-muted">
                Cargando alertas...
              </div>
            ) : !visibleItems.length ? (
              <div className="p-6 text-center text-xs text-muted">
                ¡Todo al día! No tenés alertas nuevas.
              </div>
            ) : (
              visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start gap-2 px-4 py-3 transition-colors hover:bg-elevated"
                >
                  <button
                    type="button"
                    onClick={() => {
                      dismissOne(item.id)
                      setOpen(false)
                      navigate(item.href)
                    }}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
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
                  <button
                    type="button"
                    onClick={() => dismissOne(item.id)}
                    aria-label="Descartar notificación"
                    title="Marcar como vista"
                    className="rounded p-1 text-muted opacity-60 transition-opacity hover:bg-surface hover:text-ink group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
