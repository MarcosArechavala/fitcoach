import { z } from 'zod'

export const listPaymentsQuerySchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  studentId: z.string().optional(),
})

export const createPaymentSchema = z.object({
  studentId: z.string().min(1, 'Seleccioná un alumno'),
  servicePlanId: z.string().optional().nullable(),
  amountArs: z.coerce.number().int().positive('El importe debe ser mayor a 0'),
  method: z.enum(['CASH', 'TRANSFER', 'MERCADO_PAGO']).default('TRANSFER'),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PAID'),
  dueDate: z.string().min(1, 'Indicá fecha de vencimiento'),
  paidAt: z.string().optional().nullable(),
  periodLabel: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

export const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  method: z.enum(['CASH', 'TRANSFER', 'MERCADO_PAGO']).optional(),
  paidAt: z.string().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

export const paymentIdParamSchema = z.object({
  id: z.string().min(1),
})
