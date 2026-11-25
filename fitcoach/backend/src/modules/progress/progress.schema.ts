import { z } from 'zod'

export const startSessionSchema = z.object({
  workoutDayId: z.string().min(1).optional(),
  assignmentId: z.string().min(1).optional(),
  dayTitleSnap: z.string().min(1).optional(),
})

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
})

export const studentIdParamSchema = z.object({
  studentId: z.string().min(1),
})

export const logSetSchema = z.object({
  workoutExerciseId: z.string().min(1).optional().nullable(),
  exerciseNameSnap: z.string().min(1),
  setNumber: z.coerce.number().int().min(1).max(30),
  weightKg: z.coerce.number().min(0).max(500).optional().nullable(),
  repsCompleted: z.coerce.number().int().min(0).max(200),
  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
  isCompleted: z.boolean().default(true),
  notes: z.string().trim().optional().nullable(),
})

export const completeSessionSchema = z.object({
  status: z.enum(['COMPLETED', 'SKIPPED']).default('COMPLETED'),
  studentNotes: z.string().trim().optional().nullable(),
})

export const createMeasurementSchema = z.object({
  recordedAt: z.string().optional(),
  weightKg: z.coerce.number().min(25).max(300).optional().nullable(),
  bodyFatPct: z.coerce.number().min(3).max(65).optional().nullable(),
  chestCm: z.coerce.number().min(40).max(200).optional().nullable(),
  waistCm: z.coerce.number().min(40).max(200).optional().nullable(),
  hipCm: z.coerce.number().min(40).max(200).optional().nullable(),
  armCm: z.coerce.number().min(15).max(80).optional().nullable(),
  thighCm: z.coerce.number().min(25).max(120).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})
