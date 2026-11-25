import { useQuery } from '@tanstack/react-query'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  UserPlus,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { apiRequest } from '@/lib/api'
import { AR_TIMEZONE, formatARS, formatDateAR } from '@/lib/formatters'

interface DashboardMetricsResponse {
  kpis: {
    activeStudents: number
    newStudentsMonth: number
    scheduledTodayCount: number
    pendingPaymentsCount: number
    pendingPaymentsArs: number
    monthIncomeArs: number
    completedSessionsMonth: number
  }
  upcomingToday: {
    id: string
    title: string
    modality: string
    scheduledAt: string
    status: string
    student: { firstName: string; lastName: string }
  }[]
  recentCompletedWorkouts: {
    id: string
    dayTitleSnap: string
    completedAt: string | null
    student: { firstName: string; lastName: string }
  }[]
  recentLeads: {
    id: string
    name: string
    goal: string
    createdAt: string
  }[]
}

function formatTimeAR(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function TrainerDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: () => apiRequest<DashboardMetricsResponse>('/settings/dashboard'),
  })

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (dashboardQuery.isError) {
    return <ErrorState onRetry={() => void dashboardQuery.refetch()} />
  }

  const { kpis, upcomingToday, recentCompletedWorkouts, recentLeads } =
    dashboardQuery.data!

  const cards = [
    { label: 'Alumnos activos', value: String(kpis.activeStudents), icon: Users },
    { label: 'Nuevos este mes', value: String(kpis.newStudentsMonth), icon: UserPlus },
    { label: 'Turnos hoy', value: String(kpis.scheduledTodayCount), icon: CalendarClock },
    {
      label: 'Pagos pendientes',
      value: `${kpis.pendingPaymentsCount} (${formatARS(kpis.pendingPaymentsArs)})`,
      icon: Clock,
    },
    { label: 'Ingresos del mes', value: formatARS(kpis.monthIncomeArs), icon: DollarSign },
    {
      label: 'Sesiones del mes',
      value: String(kpis.completedSessionsMonth),
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
          Dashboard del Entrenador
        </h1>
        <p className="text-sm text-muted">
          Métricas en tiempo real de alumnos, turnos, entrenamientos e ingresos en ARS.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">{kpi.label}</span>
                <Icon className="h-4 w-4 text-brand-text" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold text-ink tabular-nums">
                {kpi.value}
              </p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximas sesiones de hoy</CardTitle>
            <CardDescription>Agenda del día (hora Argentina)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!upcomingToday.length ? (
              <p className="text-sm text-muted">No hay turnos programados para hoy.</p>
            ) : (
              upcomingToday.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-line bg-canvas px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-brand-text tabular-nums">
                      {formatTimeAR(s.scheduledAt)} hs
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {s.student.firstName} {s.student.lastName}
                      </p>
                      <p className="text-xs text-muted">{s.title}</p>
                    </div>
                  </div>
                  <Badge variant={s.status === 'CONFIRMED' ? 'success' : 'warning'}>
                    {s.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Entrenamientos completados y nuevas consultas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentCompletedWorkouts.length && !recentLeads.length ? (
              <p className="text-sm text-muted">Todavía no hay actividad reciente.</p>
            ) : (
              <>
                {recentCompletedWorkouts.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-lg border border-line bg-canvas px-4 py-3"
                  >
                    <p className="text-sm font-medium text-ink">
                      {w.student.firstName} {w.student.lastName} completó {w.dayTitleSnap}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {w.completedAt ? formatDateAR(w.completedAt) : ''} · Portal Alumno
                    </p>
                  </div>
                ))}
                {recentLeads.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-lg border border-line bg-canvas px-4 py-3"
                  >
                    <p className="text-sm font-medium text-ink">
                      Nueva consulta: {l.name} ({l.goal})
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDateAR(l.createdAt)} · Landing Page
                    </p>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
