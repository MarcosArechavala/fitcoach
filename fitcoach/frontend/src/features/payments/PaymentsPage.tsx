import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CreditCard, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest, ApiError } from '@/lib/api'
import { formatARS, formatDateAR } from '@/lib/formatters'

interface PaymentDTO {
  id: string
  amountArs: number
  method: 'CASH' | 'TRANSFER' | 'MERCADO_PAGO'
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  paidAt: string | null
  periodLabel: string | null
  student: { id: string; firstName: string; lastName: string }
  servicePlan: { id: string; name: string } | null
}

interface PaymentsResponse {
  payments: PaymentDTO[]
  summary: {
    collectedThisMonthArs: number
    pendingAmountArs: number
    pendingCount: number
  }
}

interface StudentOpt {
  id: string
  firstName: string
  lastName: string
  activePlan: { id: string; name: string; priceArs: number } | null
}

const METHOD_LABEL: Record<PaymentDTO['method'], string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  MERCADO_PAGO: 'Mercado Pago',
}

const STATUS_LABEL: Record<PaymentDTO['status'], string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  CANCELLED: 'Anulado',
}

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [studentId, setStudentId] = React.useState('')
  const [amountArs, setAmountArs] = React.useState('')
  const [method, setMethod] = React.useState<'TRANSFER' | 'CASH'>('TRANSFER')
  const [status, setStatus] = React.useState<'PAID' | 'PENDING'>('PAID')
  const [dueDate, setDueDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [periodLabel, setPeriodLabel] = React.useState('')

  const paymentsQuery = useQuery({
    queryKey: ['payments', statusFilter],
    queryFn: () => {
      const qs = statusFilter ? `?status=${statusFilter}` : ''
      return apiRequest<PaymentsResponse>(`/payments${qs}`)
    },
  })

  const studentsQuery = useQuery({
    queryKey: ['students-payments'],
    enabled: modalOpen,
    queryFn: () => apiRequest<{ students: StudentOpt[] }>('/students?status=ACTIVE'),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          amountArs: Number(amountArs),
          method,
          status,
          dueDate,
          periodLabel: periodLabel || null,
        }),
      }),
    onSuccess: () => {
      toast.success('Pago registrado')
      setModalOpen(false)
      setAmountArs('')
      setPeriodLabel('')
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al registrar'),
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/payments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAID' }),
      }),
    onSuccess: () => {
      toast.success('Pago marcado como cobrado')
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
            Pagos y Mensualidades
          </h1>
          <p className="text-sm text-muted">
            Control de cobros en ARS (Transferencia / Efectivo). Listo para integrar Mercado Pago.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Registrar pago
        </Button>
      </div>

      {paymentsQuery.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-muted">Cobrado este mes</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-brand-text tabular-nums">
              {formatARS(paymentsQuery.data.summary.collectedThisMonthArs)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted">Pendiente de cobro</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink tabular-nums">
              {formatARS(paymentsQuery.data.summary.pendingAmountArs)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted">Cuotas pendientes</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink tabular-nums">
              {paymentsQuery.data.summary.pendingCount}
            </p>
          </Card>
        </div>
      )}

      <Card className="flex items-center justify-between gap-3 p-4">
        <span className="text-sm font-medium text-muted">Filtrar por estado:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
        >
          <option value="">Todos</option>
          <option value="PAID">Pagados</option>
          <option value="PENDING">Pendientes</option>
          <option value="OVERDUE">Vencidos</option>
        </select>
      </Card>

      {paymentsQuery.isLoading ? (
        <LoadingSkeleton className="h-48 w-full" />
      ) : paymentsQuery.isError ? (
        <ErrorState onRetry={() => void paymentsQuery.refetch()} />
      ) : !paymentsQuery.data?.payments.length ? (
        <EmptyState
          title="No hay pagos registrados"
          description="Registrá el primer cobro mensual en efectivo o transferencia."
          actionLabel="Registrar pago"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {paymentsQuery.data.payments.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CreditCard className="h-4 w-4 text-brand-text" aria-hidden="true" />
                    <p className="font-display text-xl font-bold text-ink">
                      {p.student.firstName} {p.student.lastName}
                    </p>
                    <Badge
                      variant={
                        p.status === 'PAID'
                          ? 'success'
                          : p.status === 'OVERDUE'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {STATUS_LABEL[p.status]}
                    </Badge>
                    <Badge variant="subtle">{METHOD_LABEL[p.method]}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    Vencimiento: {formatDateAR(p.dueDate)}
                    {p.paidAt ? ` · Pagado: ${formatDateAR(p.paidAt)}` : ''}
                    {p.periodLabel ? ` · ${p.periodLabel}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl font-extrabold text-ink tabular-nums">
                    {formatARS(p.amountArs)}
                  </span>
                  {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                    <Button size="sm" onClick={() => markPaidMutation.mutate(p.id)}>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Marcar pagado
                    </Button>
                  )}
                </div>
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
                Registrar pago
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
                  onChange={(e) => {
                    const id = e.target.value
                    setStudentId(id)
                    const st = studentsQuery.data?.students.find((s) => s.id === id)
                    if (st?.activePlan) {
                      setAmountArs(String(st.activePlan.priceArs))
                    }
                  }}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Importe (ARS)</Label>
                  <Input
                    type="number"
                    value={amountArs}
                    onChange={(e) => setAmountArs(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Método</Label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'TRANSFER' | 'CASH')}
                    className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CASH">Efectivo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Estado</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'PAID' | 'PENDING')}
                    className="h-11 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink"
                  >
                    <option value="PAID">Pagado</option>
                    <option value="PENDING">Pendiente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Vencimiento</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Período / Concepto</Label>
                <Input
                  placeholder="Ej. Cuota Noviembre 2026"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!studentId || !amountArs || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? 'Guardando...' : 'Guardar pago'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
