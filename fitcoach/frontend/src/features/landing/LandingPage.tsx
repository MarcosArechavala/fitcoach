import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import {
  Activity,
  ArrowRight,
  Award,
  Check,
  ClipboardList,
  Dumbbell,
  Flame,
  Laptop,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { useTheme } from '@/components/shared/ThemeProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiRequest, ApiError } from '@/lib/api'
import { BRAND_CONFIG, type ServiceItem } from '@/lib/brand.config'
import { buildWhatsAppUrl, formatARS } from '@/lib/formatters'
import { cn } from '@/lib/utils'

const contactSchema = z.object({
  name: z.string().min(2, 'Ingresá tu nombre completo'),
  email: z.string().email('Ingresá un email válido'),
  whatsapp: z
    .string()
    .min(8, 'Ingresá un número de WhatsApp válido (ej. +54 9 11 ...)'),
  goal: z.string().min(2, 'Contanos tu objetivo principal'),
  message: z.string().min(10, 'Escribí un breve mensaje (mínimo 10 caracteres)'),
})

type ContactFormValues = z.infer<typeof contactSchema>

const SERVICE_ICONS: Record<ServiceItem['iconName'], React.ComponentType<{ className?: string }>> = {
  dumbbell: Dumbbell,
  laptop: Laptop,
  flame: Flame,
  activity: Activity,
  clipboard: ClipboardList,
}

const CURRENT_YEAR = new Date().getFullYear()

const NAV_LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#planes', label: 'Planes' },
  { href: '#sobre-mi', label: 'Sobre mí' },
  { href: '#testimonios', label: 'Testimonios' },
  { href: '#contacto', label: 'Contacto' },
]

export function LandingPage() {
  const { slug } = useParams<{ slug?: string }>()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [submittedLead, setSubmittedLead] = React.useState<ContactFormValues | null>(null)

  const publicQuery = useQuery({
    queryKey: ['public-settings', slug ?? 'default'],
    queryFn: () =>
      apiRequest<{
        site: {
          brandName: string
          tagline: string
          location: string
          whatsapp: string
          email: string
          scheduleText?: string | null
          primaryColor?: string
          heroImageUrl?: string | null
          heroTitle?: string | null
          heroSubtitle?: string | null
          services?: ServiceItem[] | null
          testimonials?: {
            id: string
            name: string
            goal: string
            quote: string
            resultBadge: string
          }[] | null
        } | null
        trainer: {
          slug: string
          firstName: string
          lastName: string
          headline: string | null
          bio: string | null
          philosophy: string | null
          experienceYears: number
          certifications?: string[] | null
          avatarUrl?: string | null
        } | null
        plans: {
          id: string
          name: string
          badge: string | null
          description: string | null
          priceArs: number
          features: string[] | null
        }[]
      }>(slug ? `/settings/public/${encodeURIComponent(slug)}` : '/settings/public'),
    retry: false,
  })

  const site = publicQuery.data?.site
  const trainerData = publicQuery.data?.trainer

  const activeBrandName = site?.brandName || BRAND_CONFIG.brandName
  const activeTagline = site?.tagline || BRAND_CONFIG.tagline
  const activeWhatsapp = site?.whatsapp || BRAND_CONFIG.whatsappNumber
  const activeEmail = site?.email || BRAND_CONFIG.email
  const activeLocation = site?.location || BRAND_CONFIG.location
  const activeHeroImage = site?.heroImageUrl || '/images/hero-fitness.jpg'
  const activeHeroTitle = site?.heroTitle || ''
  const activeHeroSubtitle =
    site?.heroSubtitle ||
    'Planes de entrenamiento personalizados, seguimiento profesional y acompañamiento para alcanzar tus objetivos de fuerza, estética y rendimiento.'

  const activeServices: ServiceItem[] =
    Array.isArray(site?.services) && site.services.length > 0
      ? site.services
      : BRAND_CONFIG.services

  const hasCustomTestimonials =
    Array.isArray(site?.testimonials) && site.testimonials.length > 0
  const activeTestimonials = hasCustomTestimonials
    ? site!.testimonials!.map((t) => ({ ...t, isDemo: false }))
    : BRAND_CONFIG.testimonials

  const activeTrainerName = trainerData
    ? `${trainerData.firstName} ${trainerData.lastName}`
    : BRAND_CONFIG.trainer.fullName
  const activeTrainerRole = trainerData?.headline || BRAND_CONFIG.trainer.role
  const activeTrainerYears =
    trainerData?.experienceYears ?? BRAND_CONFIG.trainer.experienceYears
  const activeTrainerBio = trainerData?.bio || BRAND_CONFIG.trainer.bio
  const activeTrainerPhilosophy =
    trainerData?.philosophy || BRAND_CONFIG.trainer.philosophy
  const activeTrainerAvatar = trainerData?.avatarUrl || '/images/coach-portrait.jpg'
  const activeCertifications =
    Array.isArray(trainerData?.certifications) && trainerData.certifications.length > 0
      ? trainerData.certifications
      : BRAND_CONFIG.trainer.certifications

  const activePlans =
    publicQuery.data?.plans?.length
      ? publicQuery.data.plans.map((p, idx) => ({
          id: p.id,
          name: p.name,
          badge: p.badge ?? undefined,
          priceARS: p.priceArs,
          periodLabel: '/ mes',
          description: p.description ?? '',
          features: Array.isArray(p.features) ? p.features : [],
          highlighted: idx === 1,
        }))
      : BRAND_CONFIG.plans

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      whatsapp: '+54 9 ',
      goal: 'Fuerza e hipertrofia',
      message: '',
    },
  })

  const onSubmit = async (data: ContactFormValues) => {
    try {
      await apiRequest('/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          ...(slug ? { trainerSlug: slug } : {}),
        }),
      })
      setSubmittedLead(data)
      toast.success('¡Consulta enviada! Te responderemos a la brevedad.')
      reset()
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'No pudimos enviar tu consulta. Probá por WhatsApp.',
      )
    }
  }

  if (slug && publicQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center text-ink">
        <BrandLogo />
        <h1 className="mt-6 font-display text-3xl font-extrabold uppercase">
          Entrenador no encontrado
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          No encontramos una página pública asociada a <strong>/{slug}</strong>.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/">
            <Button>Ir al inicio</Button>
          </Link>
          <Link to="/registro">
            <Button variant="outline">Crear mi página</Button>
          </Link>
        </div>
      </div>
    )
  }

  const whatsappHref = buildWhatsAppUrl(
    activeWhatsapp,
    'Hola! Quiero consultar por los planes de entrenamiento de FITCOACH.',
  )

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg">
            <BrandLogo brandName={activeBrandName} tagline={activeTagline} />
          </a>

          <nav aria-label="Navegación principal" className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/trainer">
              <Button variant="ghost" size="sm">
                Panel Coach
              </Button>
            </Link>
            <Link to="/portal">
              <Button variant="secondary" size="sm">
                Portal Alumnos
              </Button>
            </Link>
            <a href="#contacto">
              <Button size="sm">
                Empezar ahora
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-line bg-surface px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-elevated"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
                <Link to="/portal" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full" size="sm">
                    Portal Alumnos
                  </Button>
                </Link>
                <Link to="/trainer" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">
                    Panel Coach
                  </Button>
                </Link>
              </div>
              <a href="#contacto" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Empezar ahora</Button>
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section
          id="inicio"
          className="relative overflow-hidden border-b border-line bg-[#0B0F14] text-[#F8FAFC]"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="z-10 lg:col-span-6"
            >
              <Badge variant="brand" className="mb-5">
                {activeLocation} · Cupos limitados
              </Badge>
              <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.98] tracking-tight text-[#F8FAFC] sm:text-5xl lg:text-6xl">
                {activeHeroTitle ? (
                  activeHeroTitle
                ) : (
                  <>
                    Entrená con propósito.{' '}
                    <span className="text-brand">Transformá tus resultados.</span>
                  </>
                )}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#CBD5E1] sm:text-lg">
                {activeHeroSubtitle}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="#contacto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Empezar ahora
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </a>
                <a href="#planes">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full border-[#27313D] bg-[#151B23] text-[#F8FAFC] hover:bg-[#1C242F] sm:w-auto"
                  >
                    Conocer los planes
                  </Button>
                </a>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[#27313D] pt-6">
                <div>
                  <p className="font-display text-2xl font-bold text-brand tabular-nums sm:text-3xl">
                    +{activeTrainerYears} años
                  </p>
                  <p className="text-xs text-[#94A3B8]">Experiencia coaching</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#F8FAFC] tabular-nums sm:text-3xl">
                    100%
                  </p>
                  <p className="text-xs text-[#94A3B8]">Planificación a medida</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#F8FAFC] tabular-nums sm:text-3xl">
                    ARS
                  </p>
                  <p className="text-xs text-[#94A3B8]">Presencial y Online</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative lg:col-span-6"
            >
              <div className="relative overflow-hidden rounded-2xl border border-[#27313D] bg-[#151B23]">
                <img
                  src={activeHeroImage}
                  alt={`Entrenamiento personalizado en ${activeBrandName}`}
                  className="aspect-[16/10] w-full object-cover lg:aspect-[4/3]"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-[#0B0F14]/85 px-5 py-3.5 backdrop-blur-md">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                      Método {activeBrandName}
                    </p>
                    <p className="text-sm font-medium text-[#F8FAFC]">
                      Rutinas en tu celular + control semanal
                    </p>
                  </div>
                  <Badge variant="subtle" className="border-[#27313D] bg-[#151B23] text-[#F8FAFC]">
                    1 a 1
                  </Badge>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Servicios */}
        <section id="servicios" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text">
              Servicios
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-ink sm:text-4xl">
              Entrenamiento diseñado para resultados reales
            </h2>
            <p className="mt-3 text-base text-muted">
              Cada modalidad se adapta a tu nivel actual, disponibilidad horaria y objetivos
              físicos concretos.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeServices.map((service) => {
              const Icon = SERVICE_ICONS[service.iconName] ?? Dumbbell
              return (
                <Card
                  key={service.id}
                  className="transition-colors duration-150 hover:border-brand/60"
                >
                  <CardHeader>
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-elevated text-brand-text">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-2xl uppercase">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted">{service.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Planes */}
        <section id="planes" className="border-y border-line bg-surface/50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text">
                  Planes mensuales
                </p>
                <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-ink sm:text-4xl">
                  Elegí la modalidad que mejor se adapta a vos
                </h2>
              </div>
              <p className="text-sm text-muted">
                Valores expresados en pesos argentinos (ARS) · Abono por transferencia o efectivo
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {activePlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    'flex flex-col justify-between p-6',
                    plan.highlighted && 'border-brand ring-1 ring-brand/40',
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-2xl font-bold uppercase text-ink">
                        {plan.name}
                      </h3>
                      {plan.badge && <Badge variant="brand">{plan.badge}</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted">{plan.description}</p>

                    <div className="mt-6 flex items-baseline gap-1.5 border-b border-line pb-6">
                      <span className="font-display text-4xl font-extrabold text-ink tabular-nums">
                        {formatARS(plan.priceARS)}
                      </span>
                      <span className="text-sm text-muted">{plan.periodLabel}</span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm text-ink">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-brand-text"
                            aria-hidden="true"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a href="#contacto" className="mt-8 block">
                    <Button
                      variant={plan.highlighted ? 'primary' : 'secondary'}
                      className="w-full"
                    >
                      Consultar por {plan.name}
                    </Button>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Sobre el entrenador */}
        <section id="sobre-mi" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                <img
                  src={activeTrainerAvatar}
                  alt={`${activeTrainerName} — ${activeTrainerRole}`}
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text">
                Sobre el entrenador
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-ink sm:text-4xl">
                {activeTrainerName}
              </h2>
              <p className="mt-1 text-base font-semibold text-muted">
                {activeTrainerRole} · {activeTrainerYears} años de
                experiencia
              </p>

              <p className="mt-6 text-base leading-relaxed text-ink">
                {activeTrainerBio}
              </p>

              <blockquote className="mt-6 rounded-xl border-l-4 border-brand bg-surface p-4 text-sm italic text-muted">
                “{activeTrainerPhilosophy}”
              </blockquote>

              <div className="mt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
                  Formación y certificaciones
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeCertifications.map((cert) => (
                    <Badge key={cert} variant="subtle" className="py-1 px-3">
                      <Award className="h-3.5 w-3.5 text-brand-text" aria-hidden="true" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section id="testimonios" className="border-y border-line bg-surface/50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text">
                  Testimonios
                </p>
                <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-ink sm:text-4xl">
                  Procesos reales, constancia medible
                </h2>
              </div>
              {!hasCustomTestimonials && (
                <Badge variant="warning">Ejemplos de demostración</Badge>
              )}
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {activeTestimonials.map((item) => (
                <Card key={item.id} className="flex flex-col justify-between p-6">
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <Badge variant="brand">{item.resultBadge}</Badge>
                      {item.isDemo && (
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-ink">“{item.quote}”</p>
                  </div>
                  <div className="mt-6 border-t border-line pt-4">
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-muted">{item.goal}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text">
                Contacto
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-ink sm:text-4xl">
                Empezá tu proceso hoy
              </h2>
              <p className="mt-3 text-base text-muted">
                Completá el formulario y coordinamos una evaluación inicial para definir el plan
                adecuado para vos.
              </p>

              <div className="mt-8 space-y-4 rounded-xl border border-line bg-surface p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    WhatsApp directo
                  </p>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-2 font-semibold text-brand-text hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    +{activeWhatsapp.replace(/\D/g, '')}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Email
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">{activeEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Ubicación
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">{activeLocation}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <Card className="p-6 sm:p-8">
                {submittedLead ? (
                  <div className="space-y-4 py-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-ink">
                      <Check className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-2xl font-bold uppercase text-ink">
                      ¡Consulta recibida, {submittedLead.name}!
                    </h3>
                    <p className="mx-auto max-w-md text-sm text-muted">
                      Tu mensaje ya llegó al panel del entrenador. Te responderá por WhatsApp o email a la brevedad.
                    </p>
                    <Button variant="secondary" onClick={() => setSubmittedLead(null)}>
                      Enviar otra consulta
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="lead-name">Nombre y apellido</Label>
                        <Input
                          id="lead-name"
                          placeholder="Ej. Juan Pérez"
                          {...register('name')}
                        />
                        {errors.name && (
                          <p className="text-xs text-danger">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lead-email">Email</Label>
                        <Input
                          id="lead-email"
                          type="email"
                          placeholder="juan@email.com"
                          {...register('email')}
                        />
                        {errors.email && (
                          <p className="text-xs text-danger">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="lead-whatsapp">WhatsApp</Label>
                        <Input
                          id="lead-whatsapp"
                          placeholder="+54 9 11 1234-5678"
                          {...register('whatsapp')}
                        />
                        {errors.whatsapp && (
                          <p className="text-xs text-danger">{errors.whatsapp.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lead-goal">Objetivo principal</Label>
                        <Input
                          id="lead-goal"
                          placeholder="Fuerza, hipertrofia, descenso de peso..."
                          {...register('goal')}
                        />
                        {errors.goal && (
                          <p className="text-xs text-danger">{errors.goal.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lead-message">Mensaje</Label>
                      <Textarea
                        id="lead-message"
                        placeholder="Contame tu disponibilidad horaria, experiencia previa o si preferís modalidad presencial u online."
                        {...register('message')}
                      />
                      {errors.message && (
                        <p className="text-xs text-danger">{errors.message.message}</p>
                      )}
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Enviando consulta...' : 'Enviar consulta'}
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted sm:flex-row sm:px-6 lg:px-8">
          <BrandLogo brandName={activeBrandName} tagline={activeTagline} />
          <p>
            © {CURRENT_YEAR} {activeBrandName} · {activeLocation}
          </p>
        </div>
      </footer>

      {/* CTA Flotante WhatsApp */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#0B0F14] shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </a>
    </div>
  )
}
