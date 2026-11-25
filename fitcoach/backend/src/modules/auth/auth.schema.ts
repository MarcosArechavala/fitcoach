import { z } from 'zod'

const RESERVED_SLUGS = new Set([
  'login',
  'registro',
  'invitacion',
  'recuperar-password',
  'trainer',
  'portal',
  'api',
  'admin',
])

export const registerTrainerSchema = z.object({
  firstName: z.string().trim().min(2, 'Ingresá tu nombre'),
  lastName: z.string().trim().min(2, 'Ingresá tu apellido'),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
  brandName: z.string().trim().min(2, 'Ingresá el nombre de tu marca o estudio'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'El enlace debe tener al menos 3 caracteres')
    .max(40, 'El enlace es demasiado largo')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones')
    .refine((val) => !RESERVED_SLUGS.has(val), 'Ese enlace está reservado por el sistema'),
  whatsapp: z.string().trim().min(8, 'Ingresá tu WhatsApp de contacto'),
})

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
