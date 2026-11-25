import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Clock, Dumbbell, ExternalLink, Info, Play } from 'lucide-react'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'

interface ActiveRoutineResponse {
  routine: {
    assignmentId: string
    startDate: string
    notes: string | null
    template: {
      id: string
      name: string
      goal: string | null
      weeksCount: number
      days: {
        id: string
        weekNumber: number
        dayNumber: number
        title: string
        notes: string | null
        exercises: {
          id: string
          sets: number
          reps: string
          targetWeightKg: number | null
          restSeconds: number
          rpeOrRir: string | null
          notes: string | null
          exercise: {
            id: string
            name: string
            muscleGroup: string
            instructions: string | null
            mediaUrl: string | null
          }
        }[]
      }[]
    }
  } | null
}

export function StudentRoutinePage() {
  const navigate = useNavigate()
  const [selectedDayId, setSelectedDayId] = React.useState<string | null>(null)
  const [expandedInfoId, setExpandedInfoId] = React.useState<string | null>(null)

  const routineQuery = useQuery({
    queryKey: ['my-routine'],
    queryFn: () => apiRequest<ActiveRoutineResponse>('/workouts/my-routine'),
  })

  const days = routineQuery.data?.routine?.template.days ?? []
  const activeDay = days.find((d) => d.id === selectedDayId) ?? days[0] ?? null

  if (routineQuery.isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-20 w-full" />
        <LoadingSkeleton className="h-44 w-full" />
      </div>
    )
  }

  if (routineQuery.isError) {
    return <ErrorState onRetry={() => void routineQuery.refetch()} />
  }

  if (!routineQuery.data?.routine) {
    return (
      <EmptyState
        title="Todavía no tenés una rutina asignada"
        description="Cuando tu entrenador te asigne tu plan de entrenamiento, va a aparecer acá."
      />
    )
  }

  const { template, notes } = routineQuery.data.routine

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-text">
          {template.goal ?? 'Plan activo'} · {template.weeksCount} semanas
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold uppercase text-ink">
          {template.name}
        </h1>
        {notes && <p className="mt-1 text-xs text-muted">{notes}</p>}
      </div>

      {/* Tabs de días */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <Button
            key={d.id}
            size="sm"
            variant={activeDay?.id === d.id ? 'primary' : 'secondary'}
            onClick={() => setSelectedDayId(d.id)}
            className="shrink-0"
          >
            S{d.weekNumber} · Día {d.dayNumber}
          </Button>
        ))}
      </div>

      {activeDay && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                {activeDay.title}
              </h2>
              <Badge variant="subtle" className="mt-1">
                {activeDay.exercises.length} ejercicios
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/portal/entrenar?dayId=${activeDay.id}`)}
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              Entrenar
            </Button>
          </div>

          {activeDay.exercises.map((item, idx) => {
            const isExpanded = expandedInfoId === item.id
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-text">
                        0{idx + 1}
                      </span>
                      <h3 className="font-display text-lg font-bold text-ink">
                        {item.exercise.name}
                      </h3>
                    </div>
                    <Badge variant="subtle" className="mt-1">
                      {item.exercise.muscleGroup}
                    </Badge>
                  </div>

                  {(item.exercise.instructions || item.exercise.mediaUrl) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setExpandedInfoId(isExpanded ? null : item.id)
                      }
                      aria-label="Ver instrucciones"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-canvas p-2.5 text-center tabular-nums">
                  <div>
                    <p className="text-[10px] uppercase text-muted">Series × Reps</p>
                    <p className="font-mono text-sm font-bold text-ink">
                      {item.sets} × {item.reps}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Peso sug.</p>
                    <p className="font-mono text-sm font-bold text-brand-text">
                      {item.targetWeightKg ? `${item.targetWeightKg} kg` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Descanso</p>
                    <p className="inline-flex items-center justify-center gap-1 font-mono text-sm font-bold text-ink">
                      <Clock className="h-3 w-3 text-muted" aria-hidden="true" />
                      {item.restSeconds}s
                    </p>
                  </div>
                </div>

                {(item.rpeOrRir || item.notes) && (
                  <p className="mt-2 text-xs text-muted">
                    {item.rpeOrRir ? `Intensidad: ${item.rpeOrRir}` : ''}
                    {item.rpeOrRir && item.notes ? ' · ' : ''}
                    {item.notes ?? ''}
                  </p>
                )}

                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-line pt-3 text-xs text-muted">
                    {item.exercise.instructions && <p>{item.exercise.instructions}</p>}
                    {item.exercise.mediaUrl && (
                      <a
                        href={item.exercise.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-brand-text hover:underline"
                      >
                        <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
                        Ver video / referencia
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
