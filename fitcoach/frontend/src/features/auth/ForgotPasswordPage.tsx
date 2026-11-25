import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
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

export function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (values: z.infer<typeof forgotSchema>) => {
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
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input id="forgot-email" type="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-xs text-danger">{errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
