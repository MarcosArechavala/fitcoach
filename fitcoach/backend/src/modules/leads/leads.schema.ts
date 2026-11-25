import { z } from 'zod'

export const createLeadSchema = z.object({
  trainerSlug: z.string().trim().optional(),
  name: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  whatsapp: z.string().min(8, 'Ingresá un WhatsApp válido'),
  goal: z.string().min(2, 'Contanos tu objetivo'),
  message: z.string().min(5, 'Escribí un breve mensaje'),
})

export const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'DISCARDED']).optional(),
  notes: z.string().trim().optional().nullable(),
})

export const leadIdParamSchema = z.object({
  id: z.string().min(1),
})
