import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest, ApiError } from '@/lib/api'

const forgotSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
})

const resetSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const [sent, setSent] = React.useState(false)

  const forgotForm = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
  })

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
  })

  const onForgotSubmit = async (values: z.infer<typeof forgotSchema>) => {
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      setSent(true)
      toast.success('Solicitud procesada')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al solicitar recuperación')
    }
  }

  const onResetSubmit = async (values: z.infer<typeof resetSchema>) => {
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: values.password }),
      })
      toast.success('Contraseña actualizada. Ya podés iniciar sesión.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'El enlace es inválido o expiró')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al login
          </Link>
          <BrandLogo />
        </div>

        <Card className="p-2">
          {token ? (
            <>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-brand-text">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-2xl uppercase">Nueva contraseña</CardTitle>
                <CardDescription>
                  Elegí una nueva contraseña segura para acceder a tu cuenta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-password">Nueva contraseña</Label>
                    <Input id="reset-password" type="password" {...resetForm.register('password')} />
                    {resetForm.formState.errors.password && (
                      <p className="text-xs text-danger">
                        {resetForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-confirm">Confirmar contraseña</Label>
                    <Input id="reset-confirm" type="password" {...resetForm.register('confirmPassword')} />
                    {resetForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-danger">
                        {resetForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={resetForm.formState.isSubmitting}
                  >
                    {resetForm.formState.isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-brand-text">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-2xl uppercase">Recuperar contraseña</CardTitle>
                <CardDescription>
                  Ingresá tu email para recibir las instrucciones de recuperación.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sent ? (
                  <p className="text-sm text-muted">
                    Si el email está registrado, recibirás un enlace en tu correo para restablecer tu contraseña.
                  </p>
                ) : (
                  <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input id="forgot-email" type="email" {...forgotForm.register('email')} />
                      {forgotForm.formState.errors.email && (
                        <p className="text-xs text-danger">
                          {forgotForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={forgotForm.formState.isSubmitting}
                    >
                      {forgotForm.formState.isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
