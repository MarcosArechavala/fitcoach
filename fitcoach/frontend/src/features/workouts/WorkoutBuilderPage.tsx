import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Layers,
  Plus,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ExerciseDTO } from '@/features/exercises/ExercisesPage'
import { apiRequest, ApiError } from '@/lib/api'

interface TemplateSummary {
  id: string
  name: string
  description: string | null
  goal: string | null
  weeksCount: number
  daysCount: number
  activeAssignmentsCount: number
}

interface WorkoutExerciseItem {
  id: string
  exerciseId: string
  sortOrder: number
  sets: number
  reps: string
  targetWeightKg: number | null
  restSeconds: number
  rpeOrRir: string | null
  notes: string | null
  exercise: ExerciseDTO
}

interface WorkoutDayDetail {
  id: string
  weekNumber: number
  dayNumber: number
  title: string
  notes: string | null
  exercises: WorkoutExerciseItem[]
}

interface TemplateDetail {
  id: string
  name: string
  description: string | null
  goal: string | null
  weeksCount: number
  days: WorkoutDayDetail[]
}

interface StudentOption {
  id: string
  firstName: string
  lastName: string
  email: string
}

export function WorkoutBuilderPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [activeWeek, setActiveWeek] = React.useState(1)

  const [newTplOpen, setNewTplOpen] = React.useState(false)
  const [tplName, setTplName] = React.useState('')
  const [tplGoal, setTplGoal] = React.useState('')
  const [tplWeeks, setTplWeeks] = React.useState(4)

  const [addExDayId, setAddExDayId] = React.useState<string | null>(null)
  const [exId, setExId] = React.useState('')
  const [exSets, setExSets] = React.useState(3)
  const [exReps, setExReps] = React.useState('8-12')
  const [exWeight, setExWeight] = React.useState('')
  const [exRest, setExRest] = React.useState(90)
  const [exRpe, setExRpe] = React.useState('RIR 2')
  const [exNotes, setExNotes] = React.useState('')

  const [assignOpen, setAssignOpen] = React.useState(false)
  const [assignStudentId, setAssignStudentId] = React.useState('')
  const [assignNotes, setAssignNotes] = React.useState('')

  const templatesQuery = useQuery({
    queryKey: ['workout-templates'],
    queryFn: () => apiRequest<{ templates: TemplateSummary[] }>('/workouts/templates'),
  })

  React.useEffect(() => {
    if (!selectedId && templatesQuery.data?.templates.length) {
      setSelectedId(templatesQuery.data.templates[0].id)
    }
  }, [selectedId, templatesQuery.data])

  const detailQuery = useQuery({
    queryKey: ['workout-template', selectedId],
    enabled: Boolean(selectedId),
    queryFn: () => apiRequest<{ template: TemplateDetail }>(`/workouts/templates/${selectedId}`),
  })

  const exercisesQuery = useQuery({
    queryKey: ['exercises-active'],
    queryFn: () => apiRequest<{ exercises: ExerciseDTO[] }>('/exercises'),
  })

  const studentsQuery = useQuery({
    queryKey: ['students-assign'],
    enabled: assignOpen,
    queryFn: () => apiRequest<{ students: StudentOption[] }>('/students?status=ACTIVE'),
  })

  const invalidateDetail = () => {
    void queryClient.invalidateQueries({ queryKey: ['workout-template', selectedId] })
    void queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
  }

  const createTplMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ template: TemplateDetail }>('/workouts/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: tplName,
          goal: tplGoal || null,
          weeksCount: tplWeeks,
          isTemplate: true,
        }),
      }),
    onSuccess: (res) => {
      toast.success('Rutina creada')
      setNewTplOpen(false)
      setTplName('')
      setTplGoal('')
      setSelectedId(res.template.id)
      setActiveWeek(1)
      invalidateDetail()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al crear'),
  })

  const addDayMutation = useMutation({
    mutationFn: (dayNumber: number) =>
      apiRequest(`/workouts/templates/${selectedId}/days`, {
        method: 'POST',
        body: JSON.stringify({
          weekNumber: activeWeek,
          dayNumber,
          title: `Día ${dayNumber}: Entrenamiento`,
        }),
      }),
    onSuccess: () => {
      toast.success('Día agregado')
      invalidateDetail()
    },
  })

  const duplicateDayMutation = useMutation({
    mutationFn: (day: WorkoutDayDetail) =>
      apiRequest(`/workouts/days/${day.id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({
          targetWeekNumber: day.weekNumber,
        }),
      }),
    onSuccess: () => {
      toast.success('Día duplicado')
      invalidateDetail()
    },
  })

  const deleteDayMutation = useMutation({
    mutationFn: (dayId: string) =>
      apiRequest(`/workouts/days/${dayId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Día eliminado')
      invalidateDetail()
    },
  })

  const addExerciseMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/workouts/days/${addExDayId}/exercises`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: exId,
          sets: exSets,
          reps: exReps,
          targetWeightKg: exWeight ? Number(exWeight) : null,
          restSeconds: exRest,
          rpeOrRir: exRpe || null,
          notes: exNotes || null,
        }),
      }),
    onSuccess: () => {
      toast.success('Ejercicio agregado al día')
      setAddExDayId(null)
      setExWeight('')
      setExNotes('')
      invalidateDetail()
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Error al agregar ejercicio'),
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiRequest(`/workouts/items/${itemId}`, { method: 'DELETE' }),
    onSuccess: invalidateDetail,
  })

  const reorderMutation = useMutation({
    mutationFn: ({ dayId, orderedItemIds }: { dayId: string; orderedItemIds: string[] }) =>
      apiRequest(`/workouts/days/${dayId}/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedItemIds }),
      }),
    onSuccess: invalidateDetail,
  })

  const assignMutation = useMutation({
    mutationFn: () =>
      apiRequest('/workouts/assign', {
        method: 'POST',
        body: JSON.stringify({
          studentId: assignStudentId,
          templateId: selectedId,
          notes: assignNotes || null,
          deactivatePrevious: true,
        }),
      }),
    onSuccess: () => {
      toast.success('Rutina asignada al alumno')
      setAssignOpen(false)
      setAssignStudentId('')
      setAssignNotes('')
      invalidateDetail()
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Error al asignar rutina'),
  })

  const moveItem = (day: WorkoutDayDetail, index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= day.exercises.length) return
    const copy = [...day.exercises]
    const [removed] = copy.splice(index, 1)
    copy.splice(target, 0, removed)
    reorderMutation.mutate({
      dayId: day.id,
      orderedItemIds: copy.map((i) => i.id),
    })
  }

  const template = detailQuery.data?.template
  const weekDays = template?.days.filter((d) => d.weekNumber === activeWeek) ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
            Constructor de Rutinas
          </h1>
          <p className="text-sm text-muted">
            Plan → Semana → Día → Ejercicio. Editar una plantilla no altera sesiones pasadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {template && (
            <Button variant="secondary" onClick={() => setAssignOpen(true)}>
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              Asignar a alumno
            </Button>
          )}
          <Button onClick={() => setNewTplOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva rutina
          </Button>
        </div>
      </div>

      {/* Selector de plantillas */}
      {templatesQuery.isLoading ? (
        <LoadingSkeleton className="h-14 w-full" />
      ) : templatesQuery.isError ? (
        <ErrorState onRetry={() => void templatesQuery.refetch()} />
      ) : !templatesQuery.data?.templates.length ? (
        <EmptyState
          title="Todavía no creaste rutinas"
          description="Creá tu primera plantilla de entrenamiento para agregar días y ejercicios."
          actionLabel="Crear rutina"
          onAction={() => setNewTplOpen(true)}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {templatesQuery.data.templates.map((t) => (
            <Button
              key={t.id}
              variant={t.id === selectedId ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setSelectedId(t.id)
                setActiveWeek(1)
              }}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              {t.name}
            </Button>
          ))}
        </div>
      )}

      {/* Constructor visual */}
      {template && (
        <div className="space-y-4">
          <Card className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                {template.name}
              </h2>
              <p className="text-xs text-muted">
                {template.goal ? `Objetivo: ${template.goal} · ` : ''}
                {template.weeksCount} semanas planificadas
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {Array.from({ length: template.weeksCount }, (_, i) => i + 1).map((w) => (
                <Button
                  key={w}
                  size="sm"
                  variant={activeWeek === w ? 'primary' : 'outline'}
                  onClick={() => setActiveWeek(w)}
                >
                  Sem {w}
                </Button>
              ))}
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              Días de la Semana {activeWeek}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addDayMutation.mutate(weekDays.length + 1)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Agregar día
            </Button>
          </div>

          {!weekDays.length ? (
            <EmptyState
              title={`Semana ${activeWeek} sin días cargados`}
              description="Agregá un día de entrenamiento o duplicá uno existente."
              actionLabel="Agregar Día 1"
              onAction={() => addDayMutation.mutate(1)}
            />
          ) : (
            <div className="space-y-4">
              {weekDays.map((day) => (
                <Card key={day.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                    <div>
                      <h3 className="font-display text-xl font-bold uppercase text-ink">
                        {day.title}
                      </h3>
                      <p className="text-xs text-muted">
                        Día {day.dayNumber} · {day.exercises.length} ejercicios
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setAddExDayId(day.id)
                          if (!exId && exercisesQuery.data?.exercises.length) {
                            setExId(exercisesQuery.data.exercises[0].id)
                          }
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Agregar ejercicio
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => duplicateDayMutation.mutate(day)}
                        title="Duplicar día"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        Duplicar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteDayMutation.mutate(day.id)}
                        aria-label="Eliminar día"
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </div>

                  {!day.exercises.length ? (
                    <p className="py-4 text-sm text-muted">
                      Sin ejercicios todavía. Usá “Agregar ejercicio” para sumar bloques.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {day.exercises.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-3 rounded-lg border border-line bg-canvas p-3 sm:flex-row sm:items-center"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-brand-text">
                                #{idx + 1}
                              </span>
                              <p className="font-semibold text-ink">{item.exercise.name}</p>
                              <Badge variant="subtle">{item.exercise.muscleGroup}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted tabular-nums">
                              {item.sets} series × {item.reps} reps
                              {item.targetWeightKg ? ` · ${item.targetWeightKg} kg` : ''}
                              {` · Descanso ${item.restSeconds}s`}
                              {item.rpeOrRir ? ` · ${item.rpeOrRir}` : ''}
                            </p>
                            {item.notes && (
                              <p className="mt-0.5 text-xs italic text-muted">{item.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={idx === 0}
                              onClick={() => moveItem(day, idx, -1)}
                              aria-label="Subir ejercicio"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={idx === day.exercises.length - 1}
                              onClick={() => moveItem(day, idx, 1)}
                              aria-label="Bajar ejercicio"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItemMutation.mutate(item.id)}
                              aria-label="Quitar ejercicio"
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Nueva Rutina */}
      {newTplOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                Nueva rutina
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setNewTplOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre de la rutina</Label>
                <Input
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="Ej. Hipertrofia 4 días"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Objetivo</Label>
                  <Input
                    value={tplGoal}
                    onChange={(e) => setTplGoal(e.target.value)}
                    placeholder="Fuerza / Hipertrofia"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Semanas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={tplWeeks}
                    onChange={(e) => setTplWeeks(Number(e.target.value) || 4)}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={tplName.trim().length < 2 || createTplMutation.isPending}
                onClick={() => createTplMutation.mutate()}
              >
                Crear rutina
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Agregar Ejercicio a Día */}
      {addExDayId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                Agregar ejercicio
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setAddExDayId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {!exercisesQuery.data?.exercises.length ? (
              <p className="text-sm text-muted">
                Primero cargá ejercicios en la sección <strong>Ejercicios</strong>.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Ejercicio</Label>
                  <select
                    value={exId}
                    onChange={(e) => setExId(e.target.value)}
                    className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    {exercisesQuery.data.exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.muscleGroup})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label>Series</Label>
                    <Input
                      type="number"
                      min={1}
                      value={exSets}
                      onChange={(e) => setExSets(Number(e.target.value) || 3)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Reps</Label>
                    <Input value={exReps} onChange={(e) => setExReps(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={exWeight}
                      onChange={(e) => setExWeight(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Descanso (seg)</Label>
                    <Input
                      type="number"
                      value={exRest}
                      onChange={(e) => setExRest(Number(e.target.value) || 90)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>RPE / RIR</Label>
                    <Input value={exRpe} onChange={(e) => setExRpe(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Notas</Label>
                  <Input
                    value={exNotes}
                    onChange={(e) => setExNotes(e.target.value)}
                    placeholder="Tempo, pausa, etc."
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!exId || addExerciseMutation.isPending}
                  onClick={() => addExerciseMutation.mutate()}
                >
                  Agregar al día
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal Asignar a Alumno */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                Asignar rutina
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setAssignOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Alumno</Label>
                <select
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                >
                  <option value="">Seleccioná un alumno...</option>
                  {studentsQuery.data?.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName} ({st.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Indicaciones iniciales</Label>
                <Input
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Ej. Comenzar con pesos moderados la semana 1"
                />
              </div>
              <Button
                className="w-full"
                disabled={!assignStudentId || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
              >
                Confirmar asignación
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
