import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogOut, ShieldCheck, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthContext'
import { apiRequest, ApiError } from '@/lib/api'

interface StudentProfileDTO {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  goal: string | null
  currentWeightKg: number | null
}

const profileSchema = z.object({
  phone: z.string().optional(),
  goal: z.string().optional(),
  currentWeightKg: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
})

export function StudentProfilePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['student-me'],
    queryFn: () => apiRequest<{ student: StudentProfileDTO }>('/students/me'),
  })

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      phone: profileQuery.data?.student.phone ?? '',
      goal: profileQuery.data?.student.goal ?? '',
      currentWeightKg: profileQuery.data?.student.currentWeightKg
        ? String(profileQuery.data.student.currentWeightKg)
        : '',
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })

  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) =>
      apiRequest('/students/me', {
        method: 'PATCH',
        body: JSON.stringify({
          phone: values.phone || null,
          goal: values.goal || null,
          currentWeightKg: values.currentWeightKg
            ? Number(values.currentWeightKg)
            : null,
        }),
      }),
    onSuccess: () => {
      toast.success('Perfil actualizado')
      void queryClient.invalidateQueries({ queryKey: ['student-me'] })
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Error al actualizar')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (values: z.infer<typeof passwordSchema>) =>
      apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success('Contraseña actualizada')
      passwordForm.reset()
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Error al cambiar contraseña')
    },
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-40 w-full" />
        <LoadingSkeleton className="h-40 w-full" />
      </div>
    )
  }

  if (profileQuery.isError) {
    return <ErrorState onRetry={() => void profileQuery.refetch()} />
  }

  const student = profileQuery.data?.student

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
          Mi Perfil
        </h1>
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Salir
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl uppercase">
            <User className="h-5 w-5 text-brand-text" aria-hidden="true" />
            {student?.firstName} {student?.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit((v) => updateMutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>Email</Label>
              <Input disabled value={student?.email ?? ''} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sp-phone">WhatsApp</Label>
              <Input id="sp-phone" {...profileForm.register('phone')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sp-weight">Peso actual (kg)</Label>
                <Input
                  id="sp-weight"
                  type="number"
                  step="0.1"
                  {...profileForm.register('currentWeightKg')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sp-goal">Objetivo</Label>
                <Input id="sp-goal" {...profileForm.register('goal')} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl uppercase">
            <ShieldCheck className="h-5 w-5 text-brand-text" aria-hidden="true" />
            Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit((v) => changePasswordMutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="pw-current">Contraseña actual</Label>
              <Input
                id="pw-current"
                type="password"
                {...passwordForm.register('currentPassword')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pw-new">Nueva contraseña</Label>
              <Input
                id="pw-new"
                type="password"
                {...passwordForm.register('newPassword')}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
