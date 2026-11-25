import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiRequest, ApiError } from '@/lib/api'
import { BRAND_CONFIG, type ServiceItem } from '@/lib/brand.config'
import { cn } from '@/lib/utils'

interface TestimonialInput {
  id: string
  name: string
  goal: string
  quote: string
  resultBadge: string
}

interface PlanRecord {
  id: string
  name: string
  badge: string | null
  description: string | null
  priceArs: number
  modality: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
  features: string[] | null
  isActive: boolean
}

interface SettingsResponse {
  site: {
    brandName: string
    tagline: string
    location: string
    whatsapp: string
    email: string
    instagram: string | null
    scheduleText: string | null
    primaryColor: string
    heroImageUrl: string | null
    heroTitle: string | null
    heroSubtitle: string | null
    services: ServiceItem[] | null
    testimonials: TestimonialInput[] | null
  } | null
  trainer: {
    slug: string
    firstName: string
    lastName: string
    headline: string | null
    bio: string | null
    philosophy: string | null
    experienceYears: number
    avatarUrl: string | null
    certifications: string[] | null
  } | null
  plans: PlanRecord[]
}

type TabKey = 'brand' | 'trainer' | 'services' | 'plans' | 'testimonials'

async function compressImageToDataUrl(file: File, maxWidth = 960): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('No se pudo procesar la imagen'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => reject(new Error('Archivo de imagen inválido'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('Error leyendo archivo'))
    reader.readAsDataURL(file)
  })
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = React.useState<TabKey>('brand')

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
    heroImageUrl: '',
    heroTitle: '',
    heroSubtitle: '',
  })

  const [servicesList, setServicesList] = React.useState<ServiceItem[]>([])
  const [testimonialsList, setTestimonialsList] = React.useState<TestimonialInput[]>([])

  const [trainerForm, setTrainerForm] = React.useState({
    slug: '',
    firstName: '',
    lastName: '',
    headline: '',
    experienceYears: 1,
    bio: '',
    philosophy: '',
    avatarUrl: '',
    certificationsText: '',
  })

  const [planDrafts, setPlanDrafts] = React.useState<
    Record<
      string,
      {
        name: string
        badge: string
        description: string
        priceArs: string
        modality: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
        featuresText: string
      }
    >
  >({})

  const [newPlan, setNewPlan] = React.useState({
    name: '',
    badge: '',
    priceArs: '',
    modality: 'ONLINE' as 'ONLINE' | 'IN_PERSON' | 'HYBRID',
    description: '',
    featuresText: '',
  })

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
        heroImageUrl: d.site.heroImageUrl ?? '',
        heroTitle: d.site.heroTitle ?? '',
        heroSubtitle: d.site.heroSubtitle ?? '',
      })
      setServicesList(
        Array.isArray(d.site.services) && d.site.services.length > 0
          ? d.site.services
          : BRAND_CONFIG.services,
      )
      setTestimonialsList(
        Array.isArray(d.site.testimonials) && d.site.testimonials.length > 0
          ? d.site.testimonials
          : BRAND_CONFIG.testimonials.map((t) => ({
              id: t.id,
              name: t.name,
              goal: t.goal,
              quote: t.quote,
              resultBadge: t.resultBadge,
            })),
      )
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
        avatarUrl: d.trainer.avatarUrl ?? '',
        certificationsText: Array.isArray(d.trainer.certifications)
          ? d.trainer.certifications.join('\n')
          : '',
      })
    }

    const drafts: typeof planDrafts = {}
    for (const p of d.plans) {
      drafts[p.id] = {
        name: p.name,
        badge: p.badge ?? '',
        description: p.description ?? '',
        priceArs: String(p.priceArs),
        modality: p.modality ?? 'ONLINE',
        featuresText: Array.isArray(p.features) ? p.features.join('\n') : '',
      }
    }
    setPlanDrafts(drafts)
  }, [settingsQuery.data])

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['trainer-settings'] })
    void queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    void queryClient.invalidateQueries({ queryKey: ['public-coaches'] })
  }

  const saveSiteMutation = useMutation({
    mutationFn: (extra?: { services?: ServiceItem[]; testimonials?: TestimonialInput[] }) =>
      apiRequest('/settings/site', {
        method: 'PUT',
        body: JSON.stringify({
          ...siteForm,
          heroImageUrl: siteForm.heroImageUrl || null,
          heroTitle: siteForm.heroTitle || null,
          heroSubtitle: siteForm.heroSubtitle || null,
          ...(extra?.services ? { services: extra.services } : {}),
          ...(extra?.testimonials ? { testimonials: extra.testimonials } : {}),
        }),
      }),
    onSuccess: () => {
      toast.success('Cambios guardados en tu landing page')
      invalidateAll()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al guardar'),
  })

  const saveTrainerMutation = useMutation({
    mutationFn: () =>
      apiRequest('/settings/trainer', {
        method: 'PUT',
        body: JSON.stringify({
          slug: trainerForm.slug || undefined,
          firstName: trainerForm.firstName,
          lastName: trainerForm.lastName,
          headline: trainerForm.headline || null,
          experienceYears: Number(trainerForm.experienceYears) || 1,
          bio: trainerForm.bio || null,
          philosophy: trainerForm.philosophy || null,
          avatarUrl: trainerForm.avatarUrl || null,
          certifications: trainerForm.certificationsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: () => {
      toast.success('Perfil y sección Sobre Mí guardados')
      invalidateAll()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al guardar'),
  })

  const savePlanMutation = useMutation({
    mutationFn: (id: string) => {
      const draft = planDrafts[id]
      return apiRequest(`/settings/plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: draft.name,
          badge: draft.badge || null,
          description: draft.description || null,
          priceArs: Number(draft.priceArs),
          modality: draft.modality,
          features: draft.featuresText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      })
    },
    onSuccess: () => {
      toast.success('Plan actualizado correctamente')
      invalidateAll()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al actualizar plan'),
  })

  const createPlanMutation = useMutation({
    mutationFn: () =>
      apiRequest('/settings/plans', {
        method: 'POST',
        body: JSON.stringify({
          name: newPlan.name,
          badge: newPlan.badge || null,
          description: newPlan.description || null,
          priceArs: Number(newPlan.priceArs),
          modality: newPlan.modality,
          features: newPlan.featuresText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          isActive: true,
        }),
      }),
    onSuccess: () => {
      toast.success('Nuevo plan creado en tu landing')
      setNewPlan({
        name: '',
        badge: '',
        priceArs: '',
        modality: 'ONLINE',
        description: '',
        featuresText: '',
      })
      invalidateAll()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al crear plan'),
  })

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/settings/plans/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Plan eliminado')
      invalidateAll()
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al eliminar plan'),
  })

  const handleImageUpload = async (
    file: File | undefined,
    onDone: (dataUrl: string) => void,
  ) => {
    if (!file) return
    try {
      const dataUrl = await compressImageToDataUrl(file)
      onDone(dataUrl)
      toast.success('Imagen cargada. Hacé clic en Guardar para aplicarla.')
    } catch {
      toast.error('No pudimos procesar la imagen')
    }
  }

  if (settingsQuery.isLoading) return <LoadingSkeleton className="h-64 w-full" />
  if (settingsQuery.isError) return <ErrorState onRetry={() => void settingsQuery.refetch()} />

  const plans = settingsQuery.data?.plans ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
          Configuración de tu Landing y Negocio
        </h1>
        <p className="text-sm text-muted">
          Personalizá fotos, textos, servicios, planes y testimonios. Todo se actualiza al instante.
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {(
          [
            { key: 'brand', label: 'Marca, Foto Hero y Contacto' },
            { key: 'trainer', label: 'Sobre Mí y Foto Coach' },
            { key: 'services', label: 'Servicios' },
            { key: 'plans', label: 'Planes y Precios' },
            { key: 'testimonials', label: 'Testimonios' },
          ] as { key: TabKey; label: string }[]
        ).map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className={cn(activeTab === tab.key && 'font-semibold')}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* TAB 1: MARCA, FOTO HERO Y CONTACTO */}
      {activeTab === 'brand' && (
        <Card>
          <CardHeader>
            <CardTitle>Marca, Portada y Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Subtítulo corto (Tagline)</Label>
              <Input
                value={siteForm.tagline}
                onChange={(e) => setSiteForm({ ...siteForm, tagline: e.target.value })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>WhatsApp (+54)</Label>
                <Input
                  value={siteForm.whatsapp}
                  onChange={(e) => setSiteForm({ ...siteForm, whatsapp: e.target.value })}
                />
              </div>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Horarios de atención</Label>
                <Input
                  value={siteForm.scheduleText}
                  onChange={(e) => setSiteForm({ ...siteForm, scheduleText: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Instagram</Label>
                <Input
                  placeholder="@tu.usuario"
                  value={siteForm.instagram}
                  onChange={(e) => setSiteForm({ ...siteForm, instagram: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-line p-4">
              <Label>Foto Principal (Portada Hero)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="Pegá una URL o subí una imagen..."
                  value={siteForm.heroImageUrl}
                  onChange={(e) => setSiteForm({ ...siteForm, heroImageUrl: e.target.value })}
                  className="flex-1"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-medium text-ink hover:bg-surface">
                  <Upload className="h-4 w-4" />
                  Subir foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      void handleImageUpload(e.target.files?.[0], (url) =>
                        setSiteForm((prev) => ({ ...prev, heroImageUrl: url })),
                      )
                    }
                  />
                </label>
              </div>
              {siteForm.heroImageUrl && (
                <img
                  src={siteForm.heroImageUrl}
                  alt="Vista previa portada"
                  className="mt-2 h-36 w-full max-w-sm rounded-lg border border-line object-cover"
                />
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Título principal del Hero (opcional)</Label>
                <Input
                  placeholder="Ej: Entrená con propósito. Transformá tus resultados."
                  value={siteForm.heroTitle}
                  onChange={(e) => setSiteForm({ ...siteForm, heroTitle: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Descripción del Hero (opcional)</Label>
                <Input
                  placeholder="Planes personalizados, seguimiento y resultados..."
                  value={siteForm.heroSubtitle}
                  onChange={(e) => setSiteForm({ ...siteForm, heroSubtitle: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={() => saveSiteMutation.mutate({})}
              disabled={saveSiteMutation.isPending}
            >
              {saveSiteMutation.isPending ? 'Guardando...' : 'Guardar marca y portada'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: SOBRE MI */}
      {activeTab === 'trainer' && (
        <Card>
          <CardHeader>
            <CardTitle>Información Sobre Mí y Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
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
              <div className="space-y-1">
                <Label>Enlace público (slug)</Label>
                <Input
                  value={trainerForm.slug}
                  onChange={(e) =>
                    setTrainerForm({
                      ...trainerForm,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Título / Especialidad</Label>
                <Input
                  placeholder="Ej: Personal Trainer & Preparador Físico"
                  value={trainerForm.headline}
                  onChange={(e) =>
                    setTrainerForm({ ...trainerForm, headline: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Años de experiencia</Label>
                <Input
                  type="number"
                  min={0}
                  value={trainerForm.experienceYears}
                  onChange={(e) =>
                    setTrainerForm({
                      ...trainerForm,
                      experienceYears: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-line p-4">
              <Label>Foto de Perfil ("Sobre el entrenador")</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="URL de tu foto o subí desde tu dispositivo..."
                  value={trainerForm.avatarUrl}
                  onChange={(e) => setTrainerForm({ ...trainerForm, avatarUrl: e.target.value })}
                  className="flex-1"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-medium text-ink hover:bg-surface">
                  <Upload className="h-4 w-4" />
                  Subir foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      void handleImageUpload(e.target.files?.[0], (url) =>
                        setTrainerForm((prev) => ({ ...prev, avatarUrl: url })),
                      )
                    }
                  />
                </label>
              </div>
              {trainerForm.avatarUrl && (
                <img
                  src={trainerForm.avatarUrl}
                  alt="Vista previa coach"
                  className="mt-2 h-36 w-28 rounded-lg border border-line object-cover"
                />
              )}
            </div>

            <div className="space-y-1">
              <Label>Biografía</Label>
              <Textarea
                rows={3}
                value={trainerForm.bio}
                onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Filosofía de entrenamiento (cita destacada)</Label>
              <Textarea
                rows={2}
                value={trainerForm.philosophy}
                onChange={(e) =>
                  setTrainerForm({ ...trainerForm, philosophy: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Certificaciones y formación (una por línea)</Label>
              <Textarea
                rows={3}
                placeholder="Profesor Nacional de Educación Física&#10;Especialista en Fuerza e Hipertrofia"
                value={trainerForm.certificationsText}
                onChange={(e) =>
                  setTrainerForm({ ...trainerForm, certificationsText: e.target.value })
                }
              />
            </div>

            <Button
              onClick={() => saveTrainerMutation.mutate()}
              disabled={saveTrainerMutation.isPending}
            >
              {saveTrainerMutation.isPending ? 'Guardando...' : 'Guardar sección Sobre Mí'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: SERVICIOS */}
      {activeTab === 'services' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Servicios que ofrecés</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setServicesList((prev) => [
                  ...prev,
                  {
                    id: `srv-${Date.now()}`,
                    title: 'Nuevo servicio',
                    description: 'Descripción breve del servicio.',
                    iconName: 'dumbbell',
                  },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Agregar servicio
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {servicesList.map((srv, idx) => (
              <div key={srv.id} className="space-y-3 rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <Input
                      value={srv.title}
                      placeholder="Título del servicio"
                      onChange={(e) => {
                        const copy = [...servicesList]
                        copy[idx] = { ...srv, title: e.target.value }
                        setServicesList(copy)
                      }}
                    />
                    <select
                      value={srv.iconName}
                      onChange={(e) => {
                        const copy = [...servicesList]
                        copy[idx] = {
                          ...srv,
                          iconName: e.target.value as ServiceItem['iconName'],
                        }
                        setServicesList(copy)
                      }}
                      className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                    >
                      <option value="dumbbell">Ícono: Mancuerna</option>
                      <option value="laptop">Ícono: Online / Laptop</option>
                      <option value="flame">Ícono: Fuerza / Llama</option>
                      <option value="activity">Ícono: Rendimiento</option>
                      <option value="clipboard">Ícono: Planificación</option>
                    </select>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setServicesList((prev) => prev.filter((_, i) => i !== idx))
                    }
                    title="Eliminar servicio"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={srv.description}
                  placeholder="Descripción del servicio"
                  onChange={(e) => {
                    const copy = [...servicesList]
                    copy[idx] = { ...srv, description: e.target.value }
                    setServicesList(copy)
                  }}
                />
              </div>
            ))}

            <Button
              onClick={() => saveSiteMutation.mutate({ services: servicesList })}
              disabled={saveSiteMutation.isPending}
            >
              {saveSiteMutation.isPending ? 'Guardando...' : 'Guardar servicios'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: PLANES Y PRECIOS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tus Planes Actuales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {plans.map((p) => {
                const draft = planDrafts[p.id]
                if (!draft) return null
                return (
                  <div key={p.id} className="space-y-3 rounded-lg border border-line p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={draft.name}
                        placeholder="Nombre del plan"
                        onChange={(e) =>
                          setPlanDrafts({
                            ...planDrafts,
                            [p.id]: { ...draft, name: e.target.value },
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePlanMutation.mutate(p.id)}
                        title="Eliminar plan"
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        value={draft.priceArs}
                        placeholder="Precio ARS"
                        onChange={(e) =>
                          setPlanDrafts({
                            ...planDrafts,
                            [p.id]: { ...draft, priceArs: e.target.value },
                          })
                        }
                      />
                      <Input
                        value={draft.badge}
                        placeholder="Etiqueta (ej: Popular)"
                        onChange={(e) =>
                          setPlanDrafts({
                            ...planDrafts,
                            [p.id]: { ...draft, badge: e.target.value },
                          })
                        }
                      />
                      <select
                        value={draft.modality}
                        onChange={(e) =>
                          setPlanDrafts({
                            ...planDrafts,
                            [p.id]: {
                              ...draft,
                              modality: e.target.value as 'ONLINE' | 'IN_PERSON' | 'HYBRID',
                            },
                          })
                        }
                        className="h-10 rounded-lg border border-line bg-surface px-2 text-xs text-ink"
                      >
                        <option value="ONLINE">Online</option>
                        <option value="IN_PERSON">Presencial</option>
                        <option value="HYBRID">Híbrido</option>
                      </select>
                    </div>
                    <Input
                      value={draft.description}
                      placeholder="Descripción breve"
                      onChange={(e) =>
                        setPlanDrafts({
                          ...planDrafts,
                          [p.id]: { ...draft, description: e.target.value },
                        })
                      }
                    />
                    <Textarea
                      rows={3}
                      placeholder="Beneficios incluidos (uno por línea)"
                      value={draft.featuresText}
                      onChange={(e) =>
                        setPlanDrafts({
                          ...planDrafts,
                          [p.id]: { ...draft, featuresText: e.target.value },
                        })
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => savePlanMutation.mutate(p.id)}
                      disabled={savePlanMutation.isPending}
                    >
                      Guardar este plan
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Nombre (ej: Plan Full)"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Precio en ARS"
                  value={newPlan.priceArs}
                  onChange={(e) => setNewPlan({ ...newPlan, priceArs: e.target.value })}
                />
                <Input
                  placeholder="Etiqueta (ej: Más elegido)"
                  value={newPlan.badge}
                  onChange={(e) => setNewPlan({ ...newPlan, badge: e.target.value })}
                />
              </div>
              <Input
                placeholder="Descripción breve del plan"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              />
              <Textarea
                rows={3}
                placeholder="Beneficios (uno por línea)"
                value={newPlan.featuresText}
                onChange={(e) => setNewPlan({ ...newPlan, featuresText: e.target.value })}
              />
              <Button
                onClick={() => createPlanMutation.mutate()}
                disabled={createPlanMutation.isPending || !newPlan.name || !newPlan.priceArs}
              >
                <Plus className="mr-1 h-4 w-4" /> Crear plan
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: TESTIMONIOS */}
      {activeTab === 'testimonials' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Testimonios de Alumnos</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTestimonialsList((prev) => [
                  ...prev,
                  {
                    id: `test-${Date.now()}`,
                    name: 'Nombre del alumno',
                    goal: 'Objetivo logrado',
                    resultBadge: 'Resultado destacado',
                    quote: 'Escribí acá el testimonio real de tu alumno.',
                  },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Agregar testimonio
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {testimonialsList.map((item, idx) => (
              <div key={item.id} className="space-y-3 rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="grid flex-1 gap-3 sm:grid-cols-3">
                    <Input
                      value={item.name}
                      placeholder="Nombre"
                      onChange={(e) => {
                        const copy = [...testimonialsList]
                        copy[idx] = { ...item, name: e.target.value }
                        setTestimonialsList(copy)
                      }}
                    />
                    <Input
                      value={item.goal}
                      placeholder="Objetivo / Plan"
                      onChange={(e) => {
                        const copy = [...testimonialsList]
                        copy[idx] = { ...item, goal: e.target.value }
                        setTestimonialsList(copy)
                      }}
                    />
                    <Input
                      value={item.resultBadge}
                      placeholder="Insignia (ej: -8 kg en 3 meses)"
                      onChange={(e) => {
                        const copy = [...testimonialsList]
                        copy[idx] = { ...item, resultBadge: e.target.value }
                        setTestimonialsList(copy)
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setTestimonialsList((prev) => prev.filter((_, i) => i !== idx))
                    }
                    title="Eliminar testimonio"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={item.quote}
                  placeholder="Frase o testimonio del alumno"
                  onChange={(e) => {
                    const copy = [...testimonialsList]
                    copy[idx] = { ...item, quote: e.target.value }
                    setTestimonialsList(copy)
                  }}
                />
              </div>
            ))}

            <Button
              onClick={() =>
                saveSiteMutation.mutate({ testimonials: testimonialsList })
              }
              disabled={saveSiteMutation.isPending}
            >
              {saveSiteMutation.isPending ? 'Guardando...' : 'Guardar testimonios'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
