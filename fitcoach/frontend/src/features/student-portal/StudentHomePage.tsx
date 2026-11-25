import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Dumbbell,
  Flame,
  Play,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthContext'
import { apiRequest } from '@/lib/api'

interface RoutineSummary {
  routine: {
    template: {
      name: string
      goal: string | null
      days: {
        id: string
        title: string
        exercises: { id: string; exercise: { name: string } }[]
      }[]
    }
  } | null
}

interface ProgressHomeSummary {
  weeklyCompleted: number
  totalCompleted: number
}

export function StudentHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const routineQuery = useQuery({
    queryKey: ['my-routine'],
    queryFn: () => apiRequest<RoutineSummary>('/workouts/my-routine'),
  })

  const progressQuery = useQuery({
    queryKey: ['my-progress'],
    queryFn: () => apiRequest<ProgressHomeSummary>('/progress/me'),
  })

  const routine = routineQuery.data?.routine
  const days = routine?.template.days ?? []
  const todayDay = days[0] ?? null
  const completedSessions = progressQuery.data?.weeklyCompleted ?? 0
  const targetSessions = Math.max(days.length, 3)
  const progressPct = Math.min(
    100,
    Math.round((completedSessions / targetSessions) * 100),
  )

  const firstName = user?.fullName.split(' ')[0] ?? 'Alumno'

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-text">
          {routine ? routine.template.name : 'Portal FITCOACH'}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold uppercase text-ink">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-muted">
          {routine?.template.goal
            ? `Objetivo activo: ${routine.template.goal}`
            : 'Consultá tu rutina y registrá tus entrenamientos'}
        </p>
      </div>

      {/* Entrenamiento del día */}
      <Card className="border-brand/50 bg-surface p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="brand">Entrenamiento disponible</Badge>
          {todayDay && (
            <span className="text-xs text-muted">
              {todayDay.exercises.length} ejercicios
            </span>
          )}
        </div>

        {todayDay ? (
          <>
            <h2 className="mt-3 font-display text-2xl font-extrabold uppercase text-ink">
              {todayDay.title}
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {todayDay.exercises.slice(0, 4).map((item) => (
                <Badge key={item.id} variant="subtle">
                  {item.exercise.name}
                </Badge>
              ))}
            </div>
            <Button
              size="lg"
              className="mt-5 w-full"
              onClick={() => navigate(`/portal/entrenar?dayId=${todayDay.id}`)}
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              Iniciar entrenamiento
            </Button>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Tu entrenador todavía no te asignó una rutina activa.
          </p>
        )}
      </Card>

      {/* Progreso semanal */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-brand-text" aria-hidden="true" />
            <h3 className="font-display text-lg font-bold uppercase text-ink">
              Progreso semanal
            </h3>
          </div>
          <span className="font-mono text-sm font-bold text-brand-text tabular-nums">
            {completedSessions}/{targetSessions} sesiones
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-elevated"
        >
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            {progressPct}% esta semana
          </span>
          <span>Total acumuladas: {progressQuery.data?.totalCompleted ?? 0}</span>
        </div>
      </Card>

      {/* Próxima sesión */}
      <Link to="/portal/sesiones" className="block">
        <Card className="transition-colors hover:border-brand/60">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-elevated text-brand-text">
                <Calendar className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Mis sesiones
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  Ver agenda e historial de turnos
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted" aria-hidden="true" />
          </CardContent>
        </Card>
      </Link>

      {/* Acceso rápido a rutina */}
      <Link to="/portal/rutina" className="block">
        <Card className="transition-colors hover:border-brand/60">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-brand-text" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">Ver rutina completa</p>
                <p className="text-xs text-muted">
                  {days.length} días asignados · Pesos sugeridos
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted" aria-hidden="true" />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
