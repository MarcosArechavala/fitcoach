import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest, ApiError } from '@/lib/api'
import { useAuth, type AuthUser } from './AuthContext'

const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await apiRequest<{ user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      setUser(data.user)
      toast.success(`Bienvenido, ${data.user.fullName}`)
      navigate(data.user.role === 'TRAINER' ? '/trainer' : '/portal', {
        replace: true,
      })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'No pudimos iniciar sesión. Verificá que el backend esté activo.'
      toast.error(msg)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md space-y-6">
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
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl uppercase">Iniciar sesión</CardTitle>
            <CardDescription>
              Accedé a tu panel de entrenador o a tu portal de alumno.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-danger">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Link
                    to="/recuperar-password"
                    className="text-xs font-medium text-brand-text hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
