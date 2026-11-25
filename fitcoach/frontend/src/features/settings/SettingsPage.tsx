import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiRequest, ApiError } from '@/lib/api'

interface SettingsResponse {
  site: {
    brandName: string
    tagline: string
    location: string
    whatsapp: string
    email: string
    instagram: string | null
    scheduleText: string | null
  } | null
  trainer: {
    slug: string
    firstName: string
    lastName: string
    headline: string | null
    bio: string | null
    philosophy: string | null
    experienceYears: number
  } | null
  plans: {
    id: string
    name: string
    badge: string | null
    description: string | null
    priceArs: number
  }[]
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const settingsQuery = useQuery({
    queryKey: ['trainer-settings'],
    queryFn: () => apiRequest<SettingsResponse>('/settings'),
  })

  const [siteForm, setSiteForm] = React.useState({
    brandName: 'FITCOACH',
    tagline: '',
    location: '',
    whatsapp: '',
    email: '',
    instagram: '',
    scheduleText: '',
  })

  const [trainerForm, setTrainerForm] = React.useState({
    slug: '',
    firstName: '',
    lastName: '',
    headline: '',
    experienceYears: 1,
    bio: '',
    philosophy: '',
  })

  const [planPrices, setPlanPrices] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const d = settingsQuery.data
    if (!d) return
    if (d.site) {
      setSiteForm({
        brandName: d.site.brandName,
        tagline: d.site.tagline,
        location: d.site.location,
        whatsapp: d.site.whatsapp,
        email: d.site.email,
        instagram: d.site.instagram ?? '',
        scheduleText: d.site.scheduleText ?? '',
      })
    }
    if (d.trainer) {
      setTrainerForm({
        slug: d.trainer.slug ?? '',
        firstName: d.trainer.firstName,
        lastName: d.trainer.lastName,
        headline: d.trainer.headline ?? '',
        experienceYears: d.trainer.experienceYears,
        bio: d.trainer.bio ?? '',
        philosophy: d.trainer.philosophy ?? '',
      })
    }
    const nextPrices: Record<string, string> = {}
    for (const p of d.plans) nextPrices[p.id] = String(p.priceArs)
    setPlanPrices(nextPrices)
  }, [settingsQuery.data])

  const saveSiteMutation = useMutation({
    mutationFn: () =>
      apiRequest('/settings/site', {
        method: 'PUT',
        body: JSON.stringify(siteForm),
      }),
    onSuccess: () => {
      toast.success('Configuración del sitio guardada')
      void queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al guardar'),
  })

  const saveTrainerMutation = useMutation({
    mutationFn: () =>
      apiRequest('/settings/trainer', {
        method: 'PUT',
        body: JSON.stringify(trainerForm),
      }),
    onSuccess: () => {
      toast.success('Perfil del entrenador guardado')
      void queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al guardar'),
  })

  const savePlanMutation = useMutation({
    mutationFn: ({ id, priceArs }: { id: string; priceArs: number }) =>
      apiRequest(`/settings/plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ priceArs }),
      }),
    onSuccess: () => {
      toast.success('Precio actualizado en ARS')
      void queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al guardar'),
  })

  if (settingsQuery.isLoading) return <LoadingSkeleton className="h-64 w-full" />
  if (settingsQuery.isError) return <ErrorState onRetry={() => void settingsQuery.refetch()} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
          Configuración del Negocio
        </h1>
        <p className="text-sm text-muted">
          Los cambios se reflejan automáticamente en tu landing page pública.
        </p>
      </div>

      {trainerForm.slug && (
        <Card className="border-brand/40 bg-elevated/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-text">
                Tu Landing Page Única
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">
                {window.location.origin}/{trainerForm.slug}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `${window.location.origin}/${trainerForm.slug}`,
                  )
                  toast.success('Enlace copiado al portapapeles')
                }}
              >
                Copiar enlace
              </Button>
              <a
                href={`/${trainerForm.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm">Ver mi landing</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Marca y Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre de marca</Label>
                <Input
                  value={siteForm.brandName}
                  onChange={(e) => setSiteForm({ ...siteForm, brandName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp (+54)</Label>
                <Input
                  value={siteForm.whatsapp}
                  onChange={(e) => setSiteForm({ ...siteForm, whatsapp: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email público</Label>
                <Input
                  value={siteForm.email}
                  onChange={(e) => setSiteForm({ ...siteForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Ubicación</Label>
                <Input
                  value={siteForm.location}
                  onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Horarios de atención</Label>
              <Input
                value={siteForm.scheduleText}
                onChange={(e) => setSiteForm({ ...siteForm, scheduleText: e.target.value })}
              />
            </div>
            <Button
              onClick={() => saveSiteMutation.mutate()}
              disabled={saveSiteMutation.isPending}
            >
              Guardar marca y contacto
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil del Entrenador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input
                  value={trainerForm.firstName}
                  onChange={(e) =>
                    setTrainerForm({ ...trainerForm, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Apellido</Label>
                <Input
                  value={trainerForm.lastName}
                  onChange={(e) =>
                    setTrainerForm({ ...trainerForm, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Biografía</Label>
              <Textarea
                value={trainerForm.bio}
                onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
              />
            </div>
            <Button
              onClick={() => saveTrainerMutation.mutate()}
              disabled={saveTrainerMutation.isPending}
            >
              Guardar perfil
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planes y Precios (ARS)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {settingsQuery.data?.plans.map((plan) => (
            <div key={plan.id} className="space-y-2 rounded-xl border border-line bg-canvas p-4">
              <p className="font-display text-xl font-bold text-ink">{plan.name}</p>
              <Label className="text-xs">Precio mensual (ARS)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={planPrices[plan.id] ?? ''}
                  onChange={(e) =>
                    setPlanPrices((prev) => ({ ...prev, [plan.id]: e.target.value }))
                  }
                />
                <Button
                  size="sm"
                  onClick={() =>
                    savePlanMutation.mutate({
                      id: plan.id,
                      priceArs: Number(planPrices[plan.id] ?? plan.priceArs),
                    })
                  }
                >
                  Guardar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
