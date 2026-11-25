import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, CheckCircle2, Dumbbell, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiRequest, ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ActiveSessionDTO {
  id: string
  workoutDayId: string | null
  dayTitleSnap: string
  status: string
  setLogs: {
    id: string
    workoutExerciseId: string | null
    exerciseNameSnap: string
    setNumber: number
    weightKg: number | null
    repsCompleted: number
    isCompleted: boolean
  }[]
}

interface RoutineData {
  routine: {
    assignmentId: string
    template: {
      days: {
        id: string
        title: string
        exercises: {
          id: string
          sets: number
          reps: string
          targetWeightKg: number | null
          restSeconds: number
          exercise: { name: string; muscleGroup: string }
        }[]
      }[]
    }
  } | null
}

export function WorkoutLoggerPage() {
  const [params] = useSearchParams()
  const requestedDayId = params.get('dayId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [sessionNotes, setSessionNotes] = React.useState('')
  const [setInputs, setSetInputs] = React.useState<
    Record<string, { weightKg: string; reps: string }>
  >({})

  const routineQuery = useQuery({
    queryKey: ['my-routine'],
    queryFn: () => apiRequest<RoutineData>('/workouts/my-routine'),
  })

  const activeSessionQuery = useQuery({
    queryKey: ['active-session'],
    queryFn: () => apiRequest<{ session: ActiveSessionDTO | null }>('/progress/sessions/active'),
  })

  const startMutation = useMutation({
    mutationFn: (payload: {
      workoutDayId?: string
      assignmentId?: string
      dayTitleSnap?: string
    }) =>
      apiRequest<{ session: ActiveSessionDTO }>('/progress/sessions/start', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-session'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al iniciar'),
  })

  const logSetMutation = useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string
      payload: {
        workoutExerciseId: string
        exerciseNameSnap: string
        setNumber: number
        weightKg: number | null
        repsCompleted: number
        isCompleted: boolean
      }
    }) =>
      apiRequest(`/progress/sessions/${sessionId}/sets`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Serie registrada')
      void queryClient.invalidateQueries({ queryKey: ['active-session'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al guardar serie'),
  })

  const completeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest(`/progress/sessions/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'COMPLETED',
          studentNotes: sessionNotes || null,
        }),
      }),
    onSuccess: () => {
      toast.success('¡Entrenamiento finalizado!')
      void queryClient.invalidateQueries({ queryKey: ['active-session'] })
      void queryClient.invalidateQueries({ queryKey: ['my-progress'] })
      navigate('/portal/progreso', { replace: true })
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Error al finalizar'),
  })

  if (routineQuery.isLoading || activeSessionQuery.isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-56 w-full" />
      </div>
    )
  }

  if (routineQuery.isError || activeSessionQuery.isError) {
    return <ErrorState onRetry={() => void activeSessionQuery.refetch()} />
  }

  const routine = routineQuery.data?.routine
  const activeSession = activeSessionQuery.data?.session
  const days = routine?.template.days ?? []
  const targetDay =
    days.find((d) => d.id === (activeSession?.workoutDayId ?? requestedDayId)) ??
    days[0] ??
    null

  if (!activeSession) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
          Registrar Entrenamiento
        </h1>
        {!targetDay ? (
          <EmptyState
            title="No tenés una rutina asignada"
            description="Cuando tu entrenador te asigne una rutina, vas a poder registrar tus sesiones acá."
          />
        ) : (
          <Card className="p-5 space-y-4">
            <Badge variant="brand">Listo para empezar</Badge>
            <h2 className="font-display text-2xl font-bold uppercase text-ink">
              {targetDay.title}
            </h2>
            <p className="text-sm text-muted">
              {targetDay.exercises.length} ejercicios planificados para esta sesión.
            </p>
            <Button
              size="lg"
              className="w-full"
              disabled={startMutation.isPending}
              onClick={() =>
                startMutation.mutate({
                  workoutDayId: targetDay.id,
                  assignmentId: routine?.assignmentId,
                  dayTitleSnap: targetDay.title,
                })
              }
            >
              <Dumbbell className="h-4 w-4" aria-hidden="true" />
              {startMutation.isPending ? 'Iniciando...' : 'Comenzar sesión ahora'}
            </Button>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Badge variant="brand">En curso</Badge>
          <h1 className="mt-1 font-display text-2xl font-extrabold uppercase text-ink">
            {activeSession.dayTitleSnap}
          </h1>
        </div>
      </div>

      {targetDay?.exercises.map((item) => {
        const loggedForEx = activeSession.setLogs.filter(
          (l) => l.exerciseNameSnap === item.exercise.name,
        )
        const completedCount = loggedForEx.filter((l) => l.isCompleted).length
        const allDone = completedCount >= item.sets

        return (
          <Card
            key={item.id}
            className={cn('p-4 space-y-3', allDone && 'border-success/50')}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  {item.exercise.name}
                </h2>
                <p className="text-xs text-muted">
                  Objetivo: {item.sets} × {item.reps}
                  {item.targetWeightKg ? ` · ${item.targetWeightKg} kg` : ''}
                </p>
              </div>
              {allDone && (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Completado
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {Array.from({ length: item.sets }, (_, i) => i + 1).map((setNum) => {
                const key = `${item.id}-${setNum}`
                const existing = loggedForEx.find((l) => l.setNumber === setNum)
                const current = setInputs[key] ?? {
                  weightKg:
                    existing?.weightKg !== null && existing?.weightKg !== undefined
                      ? String(existing.weightKg)
                      : item.targetWeightKg
                        ? String(item.targetWeightKg)
                        : '',
                  reps:
                    existing?.repsCompleted !== undefined
                      ? String(existing.repsCompleted)
                      : '10',
                }

                return (
                  <div
                    key={key}
                    className="grid grid-cols-12 items-center gap-2 rounded-lg bg-canvas p-2"
                  >
                    <span className="col-span-2 font-mono text-xs font-bold text-muted">
                      S{setNum}
                    </span>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        aria-label={`Peso serie ${setNum}`}
                        className="h-9 text-xs"
                        value={current.weightKg}
                        onChange={(e) =>
                          setSetInputs((prev) => ({
                            ...prev,
                            [key]: { ...current, weightKg: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        placeholder="reps"
                        aria-label={`Repeticiones serie ${setNum}`}
                        className="h-9 text-xs"
                        value={current.reps}
                        onChange={(e) =>
                          setSetInputs((prev) => ({
                            ...prev,
                            [key]: { ...current, reps: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        size="icon"
                        variant={existing?.isCompleted ? 'primary' : 'secondary'}
                        className="h-9 w-9"
                        aria-label={`Guardar serie ${setNum}`}
                        onClick={() =>
                          logSetMutation.mutate({
                            sessionId: activeSession.id,
                            payload: {
                              workoutExerciseId: item.id,
                              exerciseNameSnap: item.exercise.name,
                              setNumber: setNum,
                              weightKg: current.weightKg
                                ? Number(current.weightKg)
                                : null,
                              repsCompleted: Number(current.reps) || 0,
                              isCompleted: true,
                            },
                          })
                        }
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}

      <Card className="p-4 space-y-3">
        <Label htmlFor="session-notes">Observaciones de la sesión</Label>
        <Textarea
          id="session-notes"
          placeholder="¿Cómo te sentiste hoy? Molestias, energía, cargas..."
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
        />
        <Button
          size="lg"
          className="w-full"
          disabled={completeMutation.isPending}
          onClick={() => completeMutation.mutate(activeSession.id)}
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          {completeMutation.isPending ? 'Guardando...' : 'Finalizar entrenamiento'}
        </Button>
      </Card>
    </div>
  )
}
