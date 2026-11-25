import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest, ApiError } from '@/lib/api'
import { useAuth, type AuthUser } from './AuthContext'

const inviteSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmá tu contraseña'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type InviteFormValues = z.infer<typeof inviteSchema>

export function AcceptInvitationPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
  })

  const onSubmit = async (values: InviteFormValues) => {
    if (!token) {
      toast.error('Falta el token de invitación en el enlace')
      return
    }
    try {
      const data = await apiRequest<{ user: AuthUser }>('/auth/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token, password: values.password }),
      })
      setUser(data.user)
      toast.success('¡Cuenta activada! Bienvenido a FITCOACH.')
      navigate('/portal', { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No pudimos activar tu cuenta')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>

        <Card className="p-2">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-brand-text">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl uppercase">Activar cuenta</CardTitle>
            <CardDescription>
              Creá tu contraseña para ingresar al Portal del Alumno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="space-y-4">
                <p className="text-sm text-danger">
                  El enlace de invitación está incompleto. Pedile a tu entrenador que te reenvíe la
                  invitación.
                </p>
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Ir al login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-pass">Contraseña (mínimo 8 caracteres)</Label>
                  <Input id="invite-pass" type="password" {...register('password')} />
                  {errors.password && (
                    <p className="text-xs text-danger">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-confirm">Repetir contraseña</Label>
                  <Input
                    id="invite-confirm"
                    type="password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Activando cuenta...' : 'Activar e ingresar'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
