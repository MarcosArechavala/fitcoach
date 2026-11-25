import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest, ApiError, setStoredToken } from '@/lib/api'
import { useAuth, type AuthUser } from './AuthContext'

const registerSchema = z.object({
  firstName: z.string().min(2, 'Ingresá tu nombre'),
  lastName: z.string().min(2, 'Ingresá tu apellido'),
  brandName: z.string().min(2, 'Ingresá el nombre de tu marca'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  whatsapp: z.string().min(8, 'Ingresá tu WhatsApp'),
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type RegisterValues = z.infer<typeof registerSchema>

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function RegisterTrainerPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [slugTouched, setSlugTouched] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      whatsapp: '+54 9 ',
    },
  })

  const firstName = watch('firstName')
  const lastName = watch('lastName')
  const currentSlug = watch('slug')

  React.useEffect(() => {
    if (!slugTouched && (firstName || lastName)) {
      const auto = slugify(`${firstName ?? ''} ${lastName ?? ''}`)
      if (auto.length >= 3) {
        setValue('slug', auto)
      }
    }
  }, [firstName, lastName, slugTouched, setValue])

  const onSubmit = async (values: RegisterValues) => {
    try {
      const data = await apiRequest<{ user: AuthUser; token?: string }>(
        '/auth/register-trainer',
        {
          method: 'POST',
          body: JSON.stringify(values),
        },
      )
      if (data.token) {
        setStoredToken(data.token)
      }
      setUser(data.user)
      toast.success('¡Tu espacio FITCOACH está listo!')
      navigate('/trainer', { replace: true })
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'No pudimos crear tu cuenta',
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </Link>
          <BrandLogo />
        </div>

        <Card className="p-2">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-brand-text">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl uppercase">Crear mi cuenta de Entrenador</CardTitle>
            <CardDescription>
              Generá tu landing page única y empezá a gestionar a tus alumnos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-first">Nombre</Label>
                  <Input id="reg-first" {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-xs text-danger">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-last">Apellido</Label>
                  <Input id="reg-last" {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-xs text-danger">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-brand">Nombre de tu marca o estudio</Label>
                <Input id="reg-brand" placeholder="Ej: Team Álvarez Coaching" {...register('brandName')} />
                {errors.brandName && (
                  <p className="text-xs text-danger">{errors.brandName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-slug">Tu enlace único (subruta)</Label>
                <Input
                  id="reg-slug"
                  placeholder="ej: martin-alvarez"
                  {...register('slug', {
                    onChange: () => setSlugTouched(true),
                  })}
                />
                <p className="text-[11px] text-muted">
                  Tu landing pública será:{' '}
                  <strong className="text-brand-text">
                    {window.location.origin}/{currentSlug || 'tu-nombre'}
                  </strong>
                </p>
                {errors.slug && (
                  <p className="text-xs text-danger">{errors.slug.message}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-wa">WhatsApp</Label>
                  <Input id="reg-wa" {...register('whatsapp')} />
                  {errors.whatsapp && (
                    <p className="text-xs text-danger">{errors.whatsapp.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-xs text-danger">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-pass">Contraseña (mín. 8 caracteres)</Label>
                <Input id="reg-pass" type="password" {...register('password')} />
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creando tu espacio...' : 'Crear mi plataforma gratis'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" className="font-semibold text-brand-text hover:underline">
                Iniciá sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
