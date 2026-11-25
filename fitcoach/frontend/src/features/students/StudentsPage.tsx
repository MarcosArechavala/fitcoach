import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Archive,
  Copy,
  Edit3,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiRequest, ApiError } from '@/lib/api'
import { buildWhatsAppUrl, formatARS, formatDateAR } from '@/lib/formatters'

interface StudentDTO {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  birthDate: string | null
  heightCm: number | null
  currentWeightKg: number | null
  goal: string | null
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  joinedAt: string
  notes: string | null
  isAccountActivated: boolean
  activePlan: { id: string; name: string; priceArs: number } | null
}

interface PlanOption {
  id: string
  name: string
  priceArs: number
}

const studentFormSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(2, 'Ingresá el nombre'),
  lastName: z.string().min(2, 'Ingresá el apellido'),
  phone: z.string().optional(),
  heightCm: z.string().optional(),
  currentWeightKg: z.string().optional(),
  goal: z.string().optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  servicePlanId: z.string().optional(),
  notes: z.string().optional(),
})

type StudentFormValues = z.infer<typeof studentFormSchema>

const EXPERIENCE_LABELS: Record<StudentDTO['experienceLevel'], string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
}

const STATUS_LABELS: Record<StudentDTO['status'], string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  ARCHIVED: 'Archivado',
}

export function StudentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingStudent, setEditingStudent] = React.useState<StudentDTO | null>(null)
  const [inviteModalUrl, setInviteModalUrl] = React.useState<string | null>(null)

  const studentsQuery = useQuery({
    queryKey: ['students', search, statusFilter],
    queryFn: () => {
      const qs = new URLSearchParams()
      if (search.trim()) qs.set('search', search.trim())
      if (statusFilter) qs.set('status', statusFilter)
      return apiRequest<{ students: StudentDTO[] }>(`/students?${qs.toString()}`)
    },
  })

  const plansQuery = useQuery({
    queryKey: ['trainer-plans'],
    queryFn: () => apiRequest<{ plans: PlanOption[] }>('/students/plans'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      experienceLevel: 'BEGINNER',
    },
  })

  const openCreateModal = () => {
    setEditingStudent(null)
    reset({
      email: '',
      firstName: '',
      lastName: '',
      phone: '+54 9 ',
      heightCm: '',
      currentWeightKg: '',
      goal: '',
      experienceLevel: 'BEGINNER',
      servicePlanId: '',
      notes: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (student: StudentDTO) => {
    setEditingStudent(student)
    reset({
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone ?? '',
      heightCm: student.heightCm ? String(student.heightCm) : '',
      currentWeightKg: student.currentWeightKg ? String(student.currentWeightKg) : '',
      goal: student.goal ?? '',
      experienceLevel: student.experienceLevel,
      servicePlanId: student.activePlan?.id ?? '',
      notes: student.notes ?? '',
    })
    setModalOpen(true)
  }

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/students/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Alumno archivado')
      void queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Error al archivar')
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/students/${id}/restore`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Alumno restaurado')
      void queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Error al restaurar')
    },
  })

  const reinviteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ invitationUrl: string }>(`/students/${id}/reinvite`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      setInviteModalUrl(data.invitationUrl)
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Error al generar invitación')
    },
  })

  const onSubmit = async (values: StudentFormValues) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      heightCm: values.heightCm ? Number(values.heightCm) : null,
      currentWeightKg: values.currentWeightKg ? Number(values.currentWeightKg) : null,
      goal: values.goal || null,
      experienceLevel: values.experienceLevel,
      servicePlanId: values.servicePlanId || null,
      notes: values.notes || null,
    }

    try {
      if (editingStudent) {
        await apiRequest(`/students/${editingStudent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        toast.success('Alumno actualizado')
        setModalOpen(false)
      } else {
        const res = await apiRequest<{ student: StudentDTO; invitationUrl: string }>(
          '/students',
          {
            method: 'POST',
            body: JSON.stringify({ ...payload, email: values.email }),
          },
        )
        toast.success('Alumno creado e invitación generada')
        setModalOpen(false)
        setInviteModalUrl(res.invitationUrl)
      }
      void queryClient.invalidateQueries({ queryKey: ['students'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar alumno')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
            Gestión de Alumnos
          </h1>
          <p className="text-sm text-muted">
            Administrá tus alumnos, invitaciones seguras al portal y planes asignados.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo alumno
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, apellido, email u objetivo..."
              className="pl-9"
              aria-label="Buscar alumnos"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="h-11 rounded-lg border border-line bg-canvas px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <option value="">Activos y pausados</option>
            <option value="ACTIVE">Solo activos</option>
            <option value="PAUSED">Pausados</option>
            <option value="ARCHIVED">Archivados</option>
          </select>
        </div>
      </Card>

      {/* List */}
      {studentsQuery.isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-20 w-full" />
          <LoadingSkeleton className="h-20 w-full" />
          <LoadingSkeleton className="h-20 w-full" />
        </div>
      ) : studentsQuery.isError ? (
        <ErrorState
          description={
            studentsQuery.error instanceof ApiError
              ? studentsQuery.error.message
              : 'Verificá que el backend y PostgreSQL estén activos.'
          }
          onRetry={() => void studentsQuery.refetch()}
        />
      ) : !studentsQuery.data?.students.length ? (
        <EmptyState
          title="Todavía no hay alumnos en esta vista"
          description="Creá tu primer alumno y compartile el enlace de invitación para que acceda al portal."
          actionLabel="Agregar alumno"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid gap-3">
          {studentsQuery.data.students.map((student) => (
            <Card key={student.id} className="p-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-ink">
                      {student.firstName} {student.lastName}
                    </h2>
                    <Badge
                      variant={
                        student.status === 'ACTIVE'
                          ? 'success'
                          : student.status === 'PAUSED'
                            ? 'warning'
                            : 'subtle'
                      }
                    >
                      {STATUS_LABELS[student.status]}
                    </Badge>
                    {!student.isAccountActivated && (
                      <Badge variant="warning">Invitación pendiente</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {student.email}
                    {student.phone ? ` · ${student.phone}` : ''}
                    {` · Ingreso: ${formatDateAR(student.joinedAt)}`}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    <Badge variant="subtle">
                      {EXPERIENCE_LABELS[student.experienceLevel]}
                    </Badge>
                    {student.activePlan && (
                      <Badge variant="brand">
                        {student.activePlan.name} ({formatARS(student.activePlan.priceArs)})
                      </Badge>
                    )}
                    {student.goal && (
                      <span className="text-muted">Objetivo: {student.goal}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {student.phone && (
                    <a
                      href={buildWhatsAppUrl(student.phone)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="ghost" size="sm" title="Abrir WhatsApp">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </a>
                  )}
                  {!student.isAccountActivated && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => reinviteMutation.mutate(student.id)}
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      Invitar
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(student)}
                  >
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </Button>
                  {student.status === 'ARCHIVED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreMutation.mutate(student.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Restaurar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveMutation.mutate(student.id)}
                      aria-label={`Archivar a ${student.firstName}`}
                    >
                      <Archive className="h-4 w-4 text-muted" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                {editingStudent ? 'Editar alumno' : 'Nuevo alumno'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="st-first">Nombre</Label>
                  <Input id="st-first" {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-xs text-danger">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="st-last">Apellido</Label>
                  <Input id="st-last" {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-xs text-danger">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="st-email">Email</Label>
                  <Input
                    id="st-email"
                    type="email"
                    disabled={Boolean(editingStudent)}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-danger">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="st-phone">WhatsApp (+54)</Label>
                  <Input id="st-phone" {...register('phone')} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="st-height">Altura (cm)</Label>
                  <Input id="st-height" type="number" {...register('heightCm')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="st-weight">Peso (kg)</Label>
                  <Input
                    id="st-weight"
                    type="number"
                    step="0.1"
                    {...register('currentWeightKg')}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="st-exp">Nivel</Label>
                  <select
                    id="st-exp"
                    {...register('experienceLevel')}
                    className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="st-goal">Objetivo</Label>
                  <Input
                    id="st-goal"
                    placeholder="Ej. Hipertrofia"
                    {...register('goal')}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="st-plan">Plan asignado</Label>
                  <select
                    id="st-plan"
                    {...register('servicePlanId')}
                    className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="">Sin plan asignado</option>
                    {plansQuery.data?.plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatARS(p.priceArs)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="st-notes">Observaciones</Label>
                <Textarea id="st-notes" {...register('notes')} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar alumno'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Invitation URL Modal */}
      {inviteModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md space-y-4 p-6">
            <h2 className="font-display text-2xl font-bold uppercase text-ink">
              Enlace de invitación
            </h2>
            <p className="text-sm text-muted">
              Compartí este enlace privado con tu alumno para que cree su contraseña (válido por
              72 hs):
            </p>
            <Input readOnly value={inviteModalUrl} className="font-mono text-xs" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteModalUrl)
                  toast.success('Enlace copiado al portapapeles')
                }}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copiar enlace
              </Button>
              <Button onClick={() => setInviteModalUrl(null)}>Listo</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
