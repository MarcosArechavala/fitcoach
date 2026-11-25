import { z } from 'zod'

export const listExercisesQuerySchema = z.object({
  search: z.string().trim().optional(),
  muscleGroup: z.string().trim().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  includeArchived: z.enum(['true', 'false']).optional(),
})

export const createExerciseSchema = z.object({
  name: z.string().min(2, 'Ingresá el nombre del ejercicio'),
  muscleGroup: z.string().min(2, 'Ingresá el grupo muscular'),
  equipment: z.string().trim().optional().nullable(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
  description: z.string().trim().optional().nullable(),
  instructions: z.string().trim().optional().nullable(),
  mediaUrl: z
    .string()
    .trim()
    .url('Ingresá una URL válida')
    .optional()
    .nullable()
    .or(z.literal('')),
})

export const updateExerciseSchema = createExerciseSchema.partial().extend({
  isArchived: z.boolean().optional(),
})

export const exerciseIdParamSchema = z.object({
  id: z.string().min(1),
})
