import { z } from 'zod'

export const idParamSchema = z.object({
  id: z.string().min(1),
})

export const dayIdParamSchema = z.object({
  dayId: z.string().min(1),
})

export const itemIdParamSchema = z.object({
  itemId: z.string().min(1),
})

export const studentIdParamSchema = z.object({
  studentId: z.string().min(1),
})

export const createTemplateSchema = z.object({
  name: z.string().min(2, 'Ingresá un nombre para la rutina'),
  description: z.string().trim().optional().nullable(),
  goal: z.string().trim().optional().nullable(),
  weeksCount: z.coerce.number().int().min(1).max(24).default(4),
  isTemplate: z.boolean().default(true),
})

export const updateTemplateSchema = createTemplateSchema.partial()

export const addDaySchema = z.object({
  weekNumber: z.coerce.number().int().min(1).max(24).default(1),
  dayNumber: z.coerce.number().int().min(1).max(7),
  title: z.string().min(2, 'Ingresá el título del día'),
  notes: z.string().trim().optional().nullable(),
})

export const updateDaySchema = addDaySchema.partial()

export const duplicateDaySchema = z.object({
  targetWeekNumber: z.coerce.number().int().min(1).max(24),
  targetDayNumber: z.coerce.number().int().min(1).max(7).optional(),
  title: z.string().min(2).optional(),
})

export const addWorkoutExerciseSchema = z.object({
  exerciseId: z.string().min(1, 'Seleccioná un ejercicio'),
  sets: z.coerce.number().int().min(1).max(20).default(3),
  reps: z.string().min(1, 'Indicá las repeticiones (ej. 8-12)').default('10-12'),
  targetWeightKg: z.coerce.number().min(0).max(500).optional().nullable(),
  restSeconds: z.coerce.number().int().min(0).max(600).default(90),
  rpeOrRir: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

export const updateWorkoutExerciseSchema = addWorkoutExerciseSchema.partial()

export const reorderExercisesSchema = z.object({
  orderedItemIds: z.array(z.string().min(1)).min(1),
})

export const assignWorkoutSchema = z.object({
  studentId: z.string().min(1, 'Seleccioná un alumno'),
  templateId: z.string().min(1, 'Seleccioná una rutina'),
  startDate: z.string().optional(),
  notes: z.string().trim().optional().nullable(),
  deactivatePrevious: z.boolean().default(true),
})
