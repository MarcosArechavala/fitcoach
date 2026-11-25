import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock } from 'lucide-react'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { AR_TIMEZONE, formatDateAR } from '@/lib/formatters'

interface StudentAppointment {
  id: string
  title: string
  modality: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  scheduledAt: string
  durationMinutes: number
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
}

const STATUS_LABEL: Record<StudentAppointment['status'], string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  RESCHEDULED: 'Reprogramada',
}

function formatTimeAR(iso: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function StudentSessionsPage() {
  const sessionsQuery = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () =>
      apiRequest<{ appointments: StudentAppointment[] }>('/appointments/my-sessions'),
  })

  if (sessionsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-24 w-full" />
      </div>
    )
  }

  if (sessionsQuery.isError) {
    return <ErrorState onRetry={() => void sessionsQuery.refetch()} />
  }

  const appointments = sessionsQuery.data?.appointments ?? []

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
        Mis Sesiones
      </h1>

      {!appointments.length ? (
        <EmptyState
          title="No tenés sesiones agendadas"
          description="Cuando tu entrenador programe tus turnos presenciales u online, aparecerán acá."
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-brand-text tabular-nums">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDateAR(apt.scheduledAt)} · {formatTimeAR(apt.scheduledAt)} hs
                  </p>
                  <h2 className="font-display text-lg font-bold text-ink">{apt.title}</h2>
                  <p className="inline-flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {apt.durationMinutes} min ·{' '}
                    {apt.modality === 'IN_PERSON' ? 'Presencial' : 'Online'}
                  </p>
                </div>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
