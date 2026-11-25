import { z } from 'zod'

export const listStudentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
})

export const createStudentSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  firstName: z.string().min(2, 'Ingresá el nombre'),
  lastName: z.string().min(2, 'Ingresá el apellido'),
  phone: z.string().trim().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  heightCm: z.coerce.number().int().min(100).max(250).optional().nullable(),
  currentWeightKg: z.coerce.number().min(25).max(300).optional().nullable(),
  goal: z.string().trim().optional().nullable(),
  experienceLevel: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .default('BEGINNER'),
  servicePlanId: z.string().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

export const updateStudentSchema = createStudentSchema
  .omit({ email: true })
  .partial()
  .extend({
    status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  })

export const updateMyProfileSchema = z.object({
  phone: z.string().trim().optional().nullable(),
  goal: z.string().trim().optional().nullable(),
  currentWeightKg: z.coerce.number().min(25).max(300).optional().nullable(),
})

export const studentIdParamSchema = z.object({
  id: z.string().min(1),
})
