import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Archive, Dumbbell, Edit3, ExternalLink, Plus, RotateCcw, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiRequest, ApiError } from '@/lib/api'

export interface ExerciseDTO {
  id: string
  name: string
  muscleGroup: string
  equipment: string | null
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  description: string | null
  instructions: string | null
  mediaUrl: string | null
  isArchived: boolean
}

const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Piernas',
  'Glúteos',
  'Hombros',
  'Brazos',
  'Core',
  'Full Body',
  'Cardio / Metabólico',
]

const DIFFICULTY_LABELS: Record<ExerciseDTO['difficulty'], string> = {
  BEGINNER: 'Inicial',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
}

const exerciseSchema = z.object({
  name: z.string().min(2, 'Ingresá el nombre'),
  muscleGroup: z.string().min(2, 'Seleccioná un grupo muscular'),
  equipment: z.string().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  description: z.string().optional(),
  instructions: z.string().optional(),
  mediaUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

type ExerciseFormValues = z.infer<typeof exerciseSchema>

export function ExercisesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [muscleGroup, setMuscleGroup] = React.useState('')
  const [includeArchived, setIncludeArchived] = React.useState(false)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ExerciseDTO | null>(null)

  const exercisesQuery = useQuery({
    queryKey: ['exercises', search, muscleGroup, includeArchived],
    queryFn: () => {
      const qs = new URLSearchParams()
      if (search.trim()) qs.set('search', search.trim())
      if (muscleGroup) qs.set('muscleGroup', muscleGroup)
      if (includeArchived) qs.set('includeArchived', 'true')
      return apiRequest<{ exercises: ExerciseDTO[] }>(`/exercises?${qs.toString()}`)
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: { difficulty: 'INTERMEDIATE', muscleGroup: 'Pecho' },
  })

  const openCreate = () => {
    setEditing(null)
    reset({
      name: '',
      muscleGroup: 'Pecho',
      equipment: '',
      difficulty: 'INTERMEDIATE',
      description: '',
      instructions: '',
      mediaUrl: '',
    })
    setModalOpen(true)
  }

  const openEdit = (ex: ExerciseDTO) => {
    setEditing(ex)
    reset({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment ?? '',
      difficulty: ex.difficulty,
      description: ex.description ?? '',
      instructions: ex.instructions ?? '',
      mediaUrl: ex.mediaUrl ?? '',
    })
    setModalOpen(true)
  }

  const toggleArchiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      apiRequest(`/exercises/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isArchived }),
      }),
    onSuccess: (_, vars) => {
      toast.success(vars.isArchived ? 'Ejercicio archivado' : 'Ejercicio restaurado')
      void queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo actualizar')
    },
  })

  const onSubmit = async (values: ExerciseFormValues) => {
    const payload = {
      ...values,
      equipment: values.equipment || null,
      description: values.description || null,
      instructions: values.instructions || null,
      mediaUrl: values.mediaUrl || null,
    }
    try {
      if (editing) {
        await apiRequest(`/exercises/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        toast.success('Ejercicio actualizado')
      } else {
        await apiRequest('/exercises', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast.success('Ejercicio creado')
      }
      setModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['exercises'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar ejercicio')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
            Biblioteca de Ejercicios
          </h1>
          <p className="text-sm text-muted">
            Catálogo reutilizable para armar tus rutinas y mostrar instrucciones al alumno.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo ejercicio
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, músculo o equipamiento..."
              className="pl-9"
            />
          </div>
          <select
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            aria-label="Filtrar por grupo muscular"
            className="h-11 rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
          >
            <option value="">Todos los grupos</option>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-muted">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Ver archivados
          </label>
        </div>
      </Card>

      {exercisesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton className="h-36 w-full" />
          <LoadingSkeleton className="h-36 w-full" />
          <LoadingSkeleton className="h-36 w-full" />
        </div>
      ) : exercisesQuery.isError ? (
        <ErrorState onRetry={() => void exercisesQuery.refetch()} />
      ) : !exercisesQuery.data?.exercises.length ? (
        <EmptyState
          title="No hay ejercicios cargados"
          description="Agregá ejercicios a tu biblioteca para empezar a construir rutinas."
          actionLabel="Crear primer ejercicio"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exercisesQuery.data.exercises.map((ex) => (
            <Card key={ex.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-brand-text" aria-hidden="true" />
                    <h2 className="font-display text-xl font-bold text-ink">{ex.name}</h2>
                  </div>
                  <Badge variant={ex.isArchived ? 'subtle' : 'brand'}>
                    {ex.muscleGroup}
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="subtle">{DIFFICULTY_LABELS[ex.difficulty]}</Badge>
                  {ex.equipment && <Badge variant="subtle">{ex.equipment}</Badge>}
                  {ex.isArchived && <Badge variant="warning">Archivado</Badge>}
                </div>

                {ex.description && (
                  <p className="mt-3 line-clamp-2 text-xs text-muted">{ex.description}</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                {ex.mediaUrl ? (
                  <a
                    href={ex.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-text hover:underline"
                  >
                    Video / Imagen
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-xs text-muted">Sin media</span>
                )}

                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(ex)}>
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleArchiveMutation.mutate({
                        id: ex.id,
                        isArchived: !ex.isArchived,
                      })
                    }
                    aria-label={ex.isArchived ? 'Restaurar ejercicio' : 'Archivar ejercicio'}
                  >
                    {ex.isArchived ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4 text-muted" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                {editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1">
                <Label htmlFor="ex-name">Nombre del ejercicio</Label>
                <Input id="ex-name" placeholder="Ej. Press banca plano" {...register('name')} />
                {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ex-muscle">Grupo muscular</Label>
                  <select
                    id="ex-muscle"
                    {...register('muscleGroup')}
                    className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    {MUSCLE_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ex-diff">Dificultad</Label>
                  <select
                    id="ex-diff"
                    {...register('difficulty')}
                    className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="BEGINNER">Inicial</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ex-eq">Equipamiento</Label>
                  <Input id="ex-eq" placeholder="Barra, mancuernas, banda..." {...register('equipment')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ex-media">URL de imagen o video</Label>
                  <Input id="ex-media" placeholder="https://..." {...register('mediaUrl')} />
                  {errors.mediaUrl && (
                    <p className="text-xs text-danger">{errors.mediaUrl.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ex-desc">Descripción breve</Label>
                <Input id="ex-desc" {...register('description')} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ex-inst">Instrucciones técnicas</Label>
                <Textarea
                  id="ex-inst"
                  placeholder="Puntos clave de postura, recorrido y respiración..."
                  {...register('instructions')}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
