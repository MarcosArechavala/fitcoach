import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Moon,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { useTheme } from '@/components/shared/ThemeProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'

interface PublicCoachSummary {
  slug: string
  firstName: string
  lastName: string
  headline: string | null
  experienceYears: number
  siteSettings: {
    brandName: string
    tagline: string
    location: string
    primaryColor: string
  } | null
}

export function PlatformLandingPage() {
  const { theme, toggleTheme } = useTheme()

  const coachesQuery = useQuery({
    queryKey: ['public-coaches'],
    queryFn: () => apiRequest<{ coaches: PublicCoachSummary[] }>('/settings/public/coaches'),
    retry: false,
  })

  const coaches = coachesQuery.data?.coaches ?? []

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Ingresar
              </Button>
            </Link>
            <Link to="/registro">
              <Button size="sm">Crear mi página</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero SaaS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4">Plataforma SaaS para Personal Trainers</Badge>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-6xl">
            Tu propia web y sistema de entrenamiento en <span className="text-brand-text">1 minuto</span>
          </h1>
          <p className="mt-5 text-base text-muted sm:text-lg">
            Obtené tu landing page única con tu marca y enlace personalizado, gestioná alumnos,
            rutinas, turnos, pagos y seguimiento de cargas desde un solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/registro">
              <Button size="lg" className="gap-2">
                Crear mi cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {coaches[0] && (
              <Link to={`/${coaches[0].slug}`}>
                <Button variant="outline" size="lg">
                  Ver landing de ejemplo
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Sparkles,
              title: 'Tu URL única',
              desc: 'Compartí fitcoach.app/tu-nombre en Instagram con tus planes, bio y WhatsApp directo.',
            },
            {
              icon: Dumbbell,
              title: 'Rutinas y Cargas',
              desc: 'Constructor de rutinas por semanas y portal móvil para que tus alumnos registren sus series.',
            },
            {
              icon: Calendar,
              title: 'Agenda y Turnos',
              desc: 'Controlá sesiones presenciales u online evitando superposición de horarios.',
            },
            {
              icon: CreditCard,
              title: 'Pagos y Alertas',
              desc: 'Seguimiento de cuotas en ARS, alertas de vencimientos y notificaciones en tiempo real.',
            },
          ].map((f) => {
            const Icon = f.icon
            return (
              <Card key={f.title}>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-brand-text">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted">{f.desc}</CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Directorio de Entrenadores Activos */}
      {coaches.length > 0 && (
        <section className="border-t border-line bg-surface/50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text">
                  Comunidad FITCOACH
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold uppercase sm:text-3xl">
                  Entrenadores activos en la plataforma
                </h2>
              </div>
              <Link to="/registro">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Users className="h-4 w-4" />
                  Sumarme como entrenador
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((coach) => (
                <Link key={coach.slug} to={`/${coach.slug}`} className="group block">
                  <Card className="h-full transition-colors group-hover:border-brand">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="subtle">/{coach.slug}</Badge>
                        <span className="text-xs text-muted">
                          {coach.experienceYears} años exp.
                        </span>
                      </div>
                      <CardTitle className="mt-2 text-lg">
                        {coach.firstName} {coach.lastName}
                      </CardTitle>
                      <p className="text-xs font-medium text-brand-text">
                        {coach.siteSettings?.brandName ?? 'FITCOACH'}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted">
                      <p className="line-clamp-2">
                        {coach.headline ?? coach.siteSettings?.tagline ?? 'Entrenamiento personalizado'}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink group-hover:text-brand-text">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-text" />
                        Ver landing y planes
                        <ArrowRight className="ml-auto h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
