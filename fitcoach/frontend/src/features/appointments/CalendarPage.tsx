import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar as CalendarIcon, Check, Clock, Plus, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest, ApiError } from '@/lib/api'
import { AR_TIMEZONE, formatDateAR } from '@/lib/formatters'

interface AppointmentDTO {
  id: string
  studentId: string
  title: string
  modality: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  scheduledAt: string
  durationMinutes: number
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  notes: string | null
  student: { id: string; firstName: string; lastName: string; phone: string | null }
}

interface StudentOpt {
  id: string
  firstName: string
  lastName: string
}

const STATUS_LABEL: Record<AppointmentDTO['status'], string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  RESCHEDULED: 'Reprogramada',
}

const MODALITY_LABEL: Record<AppointmentDTO['modality'], string> = {
  IN_PERSON: 'Presencial',
  ONLINE: 'Online',
  HYBRID: 'Híbrida',
}

function formatTimeAR(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function CalendarPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [studentId, setStudentId] = React.useState('')
  const [title, setTitle] = React.useState('Sesión 1 a 1')
  const [modality, setModality] = React.useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON')
  const [scheduledAt, setScheduledAt] = React.useState('')
  const [durationMinutes, setDurationMinutes] = React.useState(60)

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () => {
      const qs = statusFilter ? `?status=${statusFilter}` : ''
      return apiRequest<{ appointments: AppointmentDTO[] }>(`/appointments${qs}`)
    },
  })

  const studentsQuery = useQuery({
    queryKey: ['students-calendar'],
    enabled: modalOpen,
    queryFn: () => apiRequest<{ students: StudentOpt[] }>('/students?status=ACTIVE'),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          title,
          modality,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes,
        }),
      }),
    onSuccess: () => {
      toast.success('Sesión agendada')
      setModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al agendar'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentDTO['status'] }) =>
      apiRequest(`/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success('Estado actualizado')
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al actualizar'),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
            Calendario de Sesiones
          </h1>
          <p className="text-sm text-muted">
            Agenda con prevención automática de superposición horaria.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agendar sesión
        </Button>
      </div>

      <Card className="flex items-center justify-between gap-3 p-4">
        <span className="text-sm font-medium text-muted">Filtrar por estado:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
        >
          <option value="">Todas las sesiones</option>
          <option value="SCHEDULED">Programadas</option>
          <option value="CONFIRMED">Confirmadas</option>
          <option value="COMPLETED">Completadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </Card>

      {appointmentsQuery.isLoading ? (
        <LoadingSkeleton className="h-48 w-full" />
      ) : appointmentsQuery.isError ? (
        <ErrorState onRetry={() => void appointmentsQuery.refetch()} />
      ) : !appointmentsQuery.data?.appointments.length ? (
        <EmptyState
          title="No hay sesiones agendadas"
          description="Creá la primera sesión para organizar tu semana."
          actionLabel="Agendar sesión"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {appointmentsQuery.data.appointments.map((apt) => (
            <Card key={apt.id} className="p-4">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-brand-text tabular-nums">
                      <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDateAR(apt.scheduledAt)} · {formatTimeAR(apt.scheduledAt)} hs
                    </span>
                    <Badge variant="subtle">{MODALITY_LABEL[apt.modality]}</Badge>
                    <Badge
                      variant={
                        apt.status === 'CONFIRMED' || apt.status === 'COMPLETED'
                          ? 'success'
                          : apt.status === 'CANCELLED'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {STATUS_LABEL[apt.status]}
                    </Badge>
                  </div>
                  <p className="font-display text-xl font-bold text-ink">
                    {apt.student.firstName} {apt.student.lastName} — {apt.title}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {apt.durationMinutes} min
                  </p>
                </div>

                {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                  <div className="flex flex-wrap gap-2">
                    {apt.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: apt.id, status: 'CONFIRMED' })
                        }
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Confirmar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: apt.id, status: 'COMPLETED' })
                      }
                    >
                      Completar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: apt.id, status: 'CANCELLED' })
                      }
                      aria-label="Cancelar sesión"
                    >
                      <XCircle className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold uppercase text-ink">
                Agendar sesión
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Alumno</Label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                >
                  <option value="">Seleccioná un alumno...</option>
                  {studentsQuery.data?.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.firstName} {st.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Modalidad</Label>
                  <select
                    value={modality}
                    onChange={(e) =>
                      setModality(e.target.value as 'IN_PERSON' | 'ONLINE')
                    }
                    className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="IN_PERSON">Presencial</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Duración (min)</Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value) || 60)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Fecha y hora</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!studentId || !scheduledAt || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? 'Agendando...' : 'Confirmar turno'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
