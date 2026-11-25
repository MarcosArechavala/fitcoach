import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

export const acceptInvitationSchema = z.object({
  token: z.string().min(10, 'Token de invitación inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
})
