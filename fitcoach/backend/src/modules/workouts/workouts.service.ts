import type { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/errors.js'

const templateDetailInclude = {
  days: {
    orderBy: [{ weekNumber: 'asc' as const }, { dayNumber: 'asc' as const }],
    include: {
      exercises: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              muscleGroup: true,
              equipment: true,
              difficulty: true,
              instructions: true,
              mediaUrl: true,
            },
          },
        },
      },
    },
  },
  _count: {
    select: {
      assignments: { where: { isActive: true } },
    },
  },
} satisfies Prisma.WorkoutTemplateInclude

function serializeTemplate(
  tpl: Prisma.WorkoutTemplateGetPayload<{ include: typeof templateDetailInclude }>,
) {
  return {
    id: tpl.id,
    name: tpl.name,
    description: tpl.description,
    goal: tpl.goal,
    weeksCount: tpl.weeksCount,
    isTemplate: tpl.isTemplate,
    activeAssignmentsCount: tpl._count.assignments,
    createdAt: tpl.createdAt,
    updatedAt: tpl.updatedAt,
    days: tpl.days.map((day) => ({
      id: day.id,
      weekNumber: day.weekNumber,
      dayNumber: day.dayNumber,
      title: day.title,
      notes: day.notes,
      exercises: day.exercises.map((item) => ({
        id: item.id,
        exerciseId: item.exerciseId,
        sortOrder: item.sortOrder,
        sets: item.sets,
        reps: item.reps,
        targetWeightKg: item.targetWeightKg ? Number(item.targetWeightKg) : null,
        restSeconds: item.restSeconds,
        rpeOrRir: item.rpeOrRir,
        notes: item.notes,
        exercise: item.exercise,
      })),
    })),
  }
}

export async function listTemplates() {
  const templates = await prisma.workoutTemplate.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: {
      days: {
        select: { id: true, weekNumber: true },
      },
      _count: {
        select: {
          assignments: { where: { isActive: true } },
        },
      },
    },
  })

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    goal: t.goal,
    weeksCount: t.weeksCount,
    isTemplate: t.isTemplate,
    daysCount: t.days.length,
    activeAssignmentsCount: t._count.assignments,
    updatedAt: t.updatedAt,
  }))
}

export async function getTemplateById(id: string) {
  const tpl = await prisma.workoutTemplate.findFirst({
    where: { id, deletedAt: null },
    include: templateDetailInclude,
  })
  if (!tpl) {
    throw new AppError('Rutina no encontrada', 404, 'NOT_FOUND')
  }
  return serializeTemplate(tpl)
}

export async function createTemplate(input: {
  name: string
  description?: string | null
  goal?: string | null
  weeksCount: number
  isTemplate: boolean
}) {
  const created = await prisma.workoutTemplate.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      goal: input.goal ?? null,
      weeksCount: input.weeksCount,
      isTemplate: input.isTemplate,
      days: {
        create: {
          weekNumber: 1,
          dayNumber: 1,
          title: 'Día 1: Cuerpo completo',
        },
      },
    },
    include: templateDetailInclude,
  })
  return serializeTemplate(created)
}

export async function updateTemplate(
  id: string,
  input: {
    name?: string
    description?: string | null
    goal?: string | null
    weeksCount?: number
    isTemplate?: boolean
  },
) {
  const existing = await prisma.workoutTemplate.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  })
  if (!existing) {
    throw new AppError('Rutina no encontrada', 404, 'NOT_FOUND')
  }

  const updated = await prisma.workoutTemplate.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.goal !== undefined ? { goal: input.goal } : {}),
      ...(input.weeksCount !== undefined ? { weeksCount: input.weeksCount } : {}),
      ...(input.isTemplate !== undefined ? { isTemplate: input.isTemplate } : {}),
    },
    include: templateDetailInclude,
  })
  return serializeTemplate(updated)
}

export async function deleteTemplate(id: string) {
  const existing = await prisma.workoutTemplate.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  })
  if (!existing) {
    throw new AppError('Rutina no encontrada', 404, 'NOT_FOUND')
  }
  await prisma.workoutTemplate.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return { deleted: true }
}

export async function addDay(
  templateId: string,
  input: { weekNumber: number; dayNumber: number; title: string; notes?: string | null },
) {
  const tpl = await prisma.workoutTemplate.findFirst({
    where: { id: templateId, deletedAt: null },
    select: { id: true },
  })
  if (!tpl) throw new AppError('Rutina no encontrada', 404, 'NOT_FOUND')

  return prisma.workoutDay.create({
    data: {
      templateId,
      weekNumber: input.weekNumber,
      dayNumber: input.dayNumber,
      title: input.title,
      notes: input.notes ?? null,
    },
  })
}

export async function updateDay(
  dayId: string,
  input: { weekNumber?: number; dayNumber?: number; title?: string; notes?: string | null },
) {
  return prisma.workoutDay.update({
    where: { id: dayId },
    data: {
      ...(input.weekNumber !== undefined ? { weekNumber: input.weekNumber } : {}),
      ...(input.dayNumber !== undefined ? { dayNumber: input.dayNumber } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  })
}

export async function deleteDay(dayId: string) {
  await prisma.workoutDay.delete({ where: { id: dayId } })
  return { deleted: true }
}

export async function duplicateDay(
  dayId: string,
  input: { targetWeekNumber: number; targetDayNumber?: number; title?: string },
) {
  const source = await prisma.workoutDay.findUnique({
    where: { id: dayId },
    include: { exercises: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!source) throw new AppError('Día no encontrado', 404, 'NOT_FOUND')

  const existingDaysInWeek = await prisma.workoutDay.count({
    where: { templateId: source.templateId, weekNumber: input.targetWeekNumber },
  })
  const nextDayNum = input.targetDayNumber ?? Math.min(existingDaysInWeek + 1, 7)

  return prisma.workoutDay.create({
    data: {
      templateId: source.templateId,
      weekNumber: input.targetWeekNumber,
      dayNumber: nextDayNum,
      title: input.title ?? `${source.title} (Copia)`,
      notes: source.notes,
      exercises: {
        create: source.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sortOrder: ex.sortOrder,
          sets: ex.sets,
          reps: ex.reps,
          targetWeightKg: ex.targetWeightKg,
          restSeconds: ex.restSeconds,
          rpeOrRir: ex.rpeOrRir,
          notes: ex.notes,
        })),
      },
    },
  })
}

export async function addExerciseToDay(
  dayId: string,
  input: {
    exerciseId: string
    sets: number
    reps: string
    targetWeightKg?: number | null
    restSeconds: number
    rpeOrRir?: string | null
    notes?: string | null
  },
) {
  const maxOrder = await prisma.workoutExercise.aggregate({
    where: { workoutDayId: dayId },
    _max: { sortOrder: true },
  })

  return prisma.workoutExercise.create({
    data: {
      workoutDayId: dayId,
      exerciseId: input.exerciseId,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      sets: input.sets,
      reps: input.reps,
      targetWeightKg: input.targetWeightKg ?? null,
      restSeconds: input.restSeconds,
      rpeOrRir: input.rpeOrRir ?? null,
      notes: input.notes ?? null,
    },
  })
}

export async function updateWorkoutExercise(
  itemId: string,
  input: {
    exerciseId?: string
    sets?: number
    reps?: string
    targetWeightKg?: number | null
    restSeconds?: number
    rpeOrRir?: string | null
    notes?: string | null
  },
) {
  return prisma.workoutExercise.update({
    where: { id: itemId },
    data: {
      ...(input.exerciseId !== undefined ? { exerciseId: input.exerciseId } : {}),
      ...(input.sets !== undefined ? { sets: input.sets } : {}),
      ...(input.reps !== undefined ? { reps: input.reps } : {}),
      ...(input.targetWeightKg !== undefined
        ? { targetWeightKg: input.targetWeightKg }
        : {}),
      ...(input.restSeconds !== undefined ? { restSeconds: input.restSeconds } : {}),
      ...(input.rpeOrRir !== undefined ? { rpeOrRir: input.rpeOrRir } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  })
}

export async function deleteWorkoutExercise(itemId: string) {
  await prisma.workoutExercise.delete({ where: { id: itemId } })
  return { deleted: true }
}

export async function reorderDayExercises(dayId: string, orderedItemIds: string[]) {
  await prisma.$transaction(
    orderedItemIds.map((itemId, index) =>
      prisma.workoutExercise.updateMany({
        where: { id: itemId, workoutDayId: dayId },
        data: { sortOrder: index + 1 },
      }),
    ),
  )
  return { reordered: true }
}

export async function assignTemplateToStudent(input: {
  studentId: string
  templateId: string
  startDate?: string
  notes?: string | null
  deactivatePrevious: boolean
}) {
  const [student, template] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: input.studentId },
      select: { id: true },
    }),
    prisma.workoutTemplate.findFirst({
      where: { id: input.templateId, deletedAt: null },
      select: { id: true },
    }),
  ])

  if (!student) throw new AppError('Alumno no encontrado', 404, 'NOT_FOUND')
  if (!template) throw new AppError('Rutina no encontrada', 404, 'NOT_FOUND')

  return prisma.$transaction(async (tx) => {
    if (input.deactivatePrevious) {
      await tx.workoutAssignment.updateMany({
        where: { studentId: input.studentId, isActive: true },
        data: { isActive: false, endDate: new Date() },
      })
    }

    return tx.workoutAssignment.create({
      data: {
        studentId: input.studentId,
        templateId: input.templateId,
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        notes: input.notes ?? null,
        isActive: true,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        template: { select: { id: true, name: true } },
      },
    })
  })
}

export async function getStudentActiveRoutine(studentId: string) {
  const assignment = await prisma.workoutAssignment.findFirst({
    where: { studentId, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      template: {
        include: templateDetailInclude,
      },
    },
  })

  if (!assignment) {
    return null
  }

  return {
    assignmentId: assignment.id,
    startDate: assignment.startDate,
    notes: assignment.notes,
    template: serializeTemplate(assignment.template),
  }
}
