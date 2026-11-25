import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiRequest, ApiError } from '@/lib/api'
import { buildWhatsAppUrl, formatDateAR } from '@/lib/formatters'

interface LeadDTO {
  id: string
  name: string
  email: string
  whatsapp: string
  goal: string
  message: string
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'DISCARDED'
  createdAt: string
}

const LEAD_STATUS_LABEL: Record<LeadDTO['status'], string> = {
  NEW: 'Nueva',
  CONTACTED: 'Contactada',
  CONVERTED: 'Convertida',
  DISCARDED: 'Descartada',
}

export function LeadsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState('')

  const leadsQuery = useQuery({
    queryKey: ['leads', statusFilter],
    queryFn: () => {
      const qs = statusFilter ? `?status=${statusFilter}` : ''
      return apiRequest<{ leads: LeadDTO[] }>(`/leads${qs}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadDTO['status'] }) =>
      apiRequest(`/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success('Estado actualizado')
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al actualizar'),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
            Consultas Comerciales
          </h1>
          <p className="text-sm text-muted">
            Contactos recibidos desde el formulario de la landing page.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink"
        >
          <option value="">Todas las consultas</option>
          <option value="NEW">Nuevas</option>
          <option value="CONTACTED">Contactadas</option>
          <option value="CONVERTED">Convertidas</option>
          <option value="DISCARDED">Descartadas</option>
        </select>
      </div>

      {leadsQuery.isLoading ? (
        <LoadingSkeleton className="h-44 w-full" />
      ) : leadsQuery.isError ? (
        <ErrorState onRetry={() => void leadsQuery.refetch()} />
      ) : !leadsQuery.data?.leads.length ? (
        <EmptyState
          title="Todavía no hay consultas"
          description="Cuando un visitante complete el formulario de la landing, aparecerá acá."
        />
      ) : (
        <div className="space-y-3">
          {leadsQuery.data.leads.map((lead) => (
            <Card key={lead.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-ink">{lead.name}</h2>
                    <Badge
                      variant={
                        lead.status === 'CONVERTED'
                          ? 'success'
                          : lead.status === 'NEW'
                            ? 'brand'
                            : 'subtle'
                      }
                    >
                      {LEAD_STATUS_LABEL[lead.status]}
                    </Badge>
                    <span className="text-xs text-muted">{formatDateAR(lead.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted">
                    {lead.email} · {lead.whatsapp} · Objetivo: <strong>{lead.goal}</strong>
                  </p>
                  <p className="pt-1 text-sm text-ink">“{lead.message}”</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={buildWhatsAppUrl(
                      lead.whatsapp,
                      `Hola ${lead.name}! Soy Martín de FITCOACH, recibí tu consulta sobre ${lead.goal}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="secondary">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      WhatsApp
                    </Button>
                  </a>
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateMutation.mutate({
                        id: lead.id,
                        status: e.target.value as LeadDTO['status'],
                      })
                    }
                    className="h-9 rounded-lg border border-line bg-canvas px-2.5 text-xs text-ink"
                  >
                    <option value="NEW">Nueva</option>
                    <option value="CONTACTED">Contactada</option>
                    <option value="CONVERTED">Convertida</option>
                    <option value="DISCARDED">Descartada</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
