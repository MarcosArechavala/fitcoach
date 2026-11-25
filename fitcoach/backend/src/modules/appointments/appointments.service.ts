import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/errors.js'

async function assertNoTimeConflict(
  trainerId: string,
  start: Date,
  durationMinutes: number,
  excludeId?: string,
) {
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const dayStart = new Date(start)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(start)
  dayEnd.setHours(23, 59, 59, 999)

  const candidates = await prisma.appointment.findMany({
    where: {
      trainerId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      status: { notIn: ['CANCELLED'] },
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    select: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
      title: true,
    },
  })

  for (const c of candidates) {
    const cStart = c.scheduledAt
    const cEnd = new Date(cStart.getTime() + c.durationMinutes * 60_000)
    if (start < cEnd && end > cStart) {
      throw new AppError(
        `Conflicto horario con "${c.title}". Elegí otro horario.`,
        409,
        'SCHEDULE_CONFLICT',
      )
    }
  }
}

export async function listAppointments(
  trainerId: string,
  filters: {
    from?: string
    to?: string
    status?: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  },
) {
  return prisma.appointment.findMany({
    where: {
      trainerId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.from || filters.to
        ? {
            scheduledAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, phone: true },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  })
}

export async function listStudentAppointments(studentId: string) {
  return prisma.appointment.findMany({
    where: { studentId },
    orderBy: { scheduledAt: 'desc' },
    take: 30,
  })
}

export async function createAppointment(
  trainerId: string,
  input: {
    studentId: string
    title: string
    modality: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
    scheduledAt: string
    durationMinutes: number
    notes?: string | null
  },
) {
  const start = new Date(input.scheduledAt)
  if (Number.isNaN(start.getTime())) {
    throw new AppError('Fecha u hora inválida', 400, 'INVALID_DATE')
  }

  await assertNoTimeConflict(trainerId, start, input.durationMinutes)

  return prisma.appointment.create({
    data: {
      trainerId,
      studentId: input.studentId,
      title: input.title,
      modality: input.modality,
      scheduledAt: start,
      durationMinutes: input.durationMinutes,
      status: 'SCHEDULED',
      notes: input.notes ?? null,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
  })
}

export async function updateAppointment(
  trainerId: string,
  id: string,
  input: {
    title?: string
    modality?: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
    scheduledAt?: string
    durationMinutes?: number
    status?: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
    notes?: string | null
  },
) {
  const existing = await prisma.appointment.findFirst({ where: { id, trainerId } })
  if (!existing) {
    throw new AppError('Sesión no encontrada', 404, 'NOT_FOUND')
  }

  const nextStart = input.scheduledAt ? new Date(input.scheduledAt) : existing.scheduledAt
  const nextDuration = input.durationMinutes ?? existing.durationMinutes
  const nextStatus = input.status ?? existing.status

  if (nextStatus !== 'CANCELLED' && (input.scheduledAt || input.durationMinutes)) {
    await assertNoTimeConflict(trainerId, nextStart, nextDuration, id)
  }

  return prisma.appointment.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.modality !== undefined ? { modality: input.modality } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: nextStart } : {}),
      ...(input.durationMinutes !== undefined
        ? { durationMinutes: input.durationMinutes }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
  })
}
