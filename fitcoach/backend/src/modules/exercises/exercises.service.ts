import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/errors.js'

export async function listExercises(filters: {
  search?: string
  muscleGroup?: string
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  includeArchived?: string
}) {
  const where: Prisma.ExerciseWhereInput = {
    ...(filters.includeArchived === 'true' ? {} : { isArchived: false }),
    ...(filters.muscleGroup ? { muscleGroup: filters.muscleGroup } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { muscleGroup: { contains: filters.search, mode: 'insensitive' } },
            { equipment: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  return prisma.exercise.findMany({
    where,
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  })
}

export async function createExercise(input: {
  name: string
  muscleGroup: string
  equipment?: string | null
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  description?: string | null
  instructions?: string | null
  mediaUrl?: string | null
}) {
  return prisma.exercise.create({
    data: {
      name: input.name,
      muscleGroup: input.muscleGroup,
      equipment: input.equipment ?? null,
      difficulty: input.difficulty,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      mediaUrl: input.mediaUrl ? input.mediaUrl : null,
    },
  })
}

export async function updateExercise(
  id: string,
  input: {
    name?: string
    muscleGroup?: string
    equipment?: string | null
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    description?: string | null
    instructions?: string | null
    mediaUrl?: string | null
    isArchived?: boolean
  },
) {
  const existing = await prisma.exercise.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    throw new AppError('Ejercicio no encontrado', 404, 'NOT_FOUND')
  }

  return prisma.exercise.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.muscleGroup !== undefined ? { muscleGroup: input.muscleGroup } : {}),
      ...(input.equipment !== undefined ? { equipment: input.equipment } : {}),
      ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      ...(input.mediaUrl !== undefined
        ? { mediaUrl: input.mediaUrl ? input.mediaUrl : null }
        : {}),
      ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
    },
  })
}
