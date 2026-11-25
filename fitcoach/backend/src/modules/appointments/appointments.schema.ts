import { z } from 'zod'

export const listAppointmentsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  status: z
    .enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'])
    .optional(),
})

export const createAppointmentSchema = z.object({
  studentId: z.string().min(1, 'Seleccioná un alumno'),
  title: z.string().min(2, 'Ingresá un título'),
  modality: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID']).default('IN_PERSON'),
  scheduledAt: z.string().min(1, 'Indicá fecha y hora'),
  durationMinutes: z.coerce.number().int().min(15).max(240).default(60),
  notes: z.string().trim().optional().nullable(),
})

export const updateAppointmentSchema = z.object({
  title: z.string().min(2).optional(),
  modality: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID']).optional(),
  scheduledAt: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(240).optional(),
  status: z
    .enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'])
    .optional(),
  notes: z.string().trim().optional().nullable(),
})

export const appointmentIdParamSchema = z.object({
  id: z.string().min(1),
})
