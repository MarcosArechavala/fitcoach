import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/errors.js'

export async function getActiveSession(studentId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { studentId, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
    include: {
      setLogs: { orderBy: [{ exerciseNameSnap: 'asc' }, { setNumber: 'asc' }] },
    },
  })

  if (!session) return null

  return {
    ...session,
    setLogs: session.setLogs.map((l) => ({
      ...l,
      weightKg: l.weightKg ? Number(l.weightKg) : null,
      rpe: l.rpe ? Number(l.rpe) : null,
    })),
  }
}

export async function startSession(
  studentId: string,
  input: { workoutDayId?: string; assignmentId?: string; dayTitleSnap?: string },
) {
  const existing = await prisma.workoutSession.findFirst({
    where: { studentId, status: 'IN_PROGRESS' },
    include: { setLogs: true },
  })
  if (existing) {
    return {
      ...existing,
      setLogs: existing.setLogs.map((l) => ({
        ...l,
        weightKg: l.weightKg ? Number(l.weightKg) : null,
        rpe: l.rpe ? Number(l.rpe) : null,
      })),
    }
  }

  let dayTitleSnap = input.dayTitleSnap ?? 'Entrenamiento libre'
  if (input.workoutDayId) {
    const day = await prisma.workoutDay.findUnique({
      where: { id: input.workoutDayId },
      select: { title: true },
    })
    if (day) dayTitleSnap = day.title
  }

  const created = await prisma.workoutSession.create({
    data: {
      studentId,
      assignmentId: input.assignmentId ?? null,
      workoutDayId: input.workoutDayId ?? null,
      dayTitleSnap,
      status: 'IN_PROGRESS',
    },
    include: { setLogs: true },
  })

  return created
}

export async function logSet(
  studentId: string,
  sessionId: string,
  input: {
    workoutExerciseId?: string | null
    exerciseNameSnap: string
    setNumber: number
    weightKg?: number | null
    repsCompleted: number
    rpe?: number | null
    isCompleted: boolean
    notes?: string | null
  },
) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, studentId },
    select: { id: true, status: true },
  })

  if (!session) {
    throw new AppError('Sesión de entrenamiento no encontrada', 404, 'NOT_FOUND')
  }
  if (session.status !== 'IN_PROGRESS') {
    throw new AppError('Esta sesión ya fue finalizada', 400, 'SESSION_CLOSED')
  }

  const existingLog = await prisma.exerciseSetLog.findFirst({
    where: {
      sessionId,
      exerciseNameSnap: input.exerciseNameSnap,
      setNumber: input.setNumber,
    },
    select: { id: true },
  })

  const saved = existingLog
    ? await prisma.exerciseSetLog.update({
        where: { id: existingLog.id },
        data: {
          weightKg: input.weightKg ?? null,
          repsCompleted: input.repsCompleted,
          rpe: input.rpe ?? null,
          isCompleted: input.isCompleted,
          notes: input.notes ?? null,
        },
      })
    : await prisma.exerciseSetLog.create({
        data: {
          sessionId,
          workoutExerciseId: input.workoutExerciseId ?? null,
          exerciseNameSnap: input.exerciseNameSnap,
          setNumber: input.setNumber,
          weightKg: input.weightKg ?? null,
          repsCompleted: input.repsCompleted,
          rpe: input.rpe ?? null,
          isCompleted: input.isCompleted,
          notes: input.notes ?? null,
        },
      })

  return {
    ...saved,
    weightKg: saved.weightKg ? Number(saved.weightKg) : null,
    rpe: saved.rpe ? Number(saved.rpe) : null,
  }
}

export async function completeSession(
  studentId: string,
  sessionId: string,
  input: { status: 'COMPLETED' | 'SKIPPED'; studentNotes?: string | null },
) {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, studentId },
    select: { id: true },
  })

  if (!session) {
    throw new AppError('Sesión de entrenamiento no encontrada', 404, 'NOT_FOUND')
  }

  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      status: input.status,
      completedAt: new Date(),
      studentNotes: input.studentNotes ?? null,
    },
  })
}

export async function createMeasurement(
  studentId: string,
  input: {
    recordedAt?: string
    weightKg?: number | null
    bodyFatPct?: number | null
    chestCm?: number | null
    waistCm?: number | null
    hipCm?: number | null
    armCm?: number | null
    thighCm?: number | null
    notes?: string | null
  },
) {
  const measurement = await prisma.$transaction(async (tx) => {
    const created = await tx.bodyMeasurement.create({
      data: {
        studentId,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
        weightKg: input.weightKg ?? null,
        bodyFatPct: input.bodyFatPct ?? null,
        chestCm: input.chestCm ?? null,
        waistCm: input.waistCm ?? null,
        hipCm: input.hipCm ?? null,
        armCm: input.armCm ?? null,
        thighCm: input.thighCm ?? null,
        notes: input.notes ?? null,
      },
    })

    if (input.weightKg !== undefined && input.weightKg !== null) {
      await tx.studentProfile.update({
        where: { id: studentId },
        data: { currentWeightKg: input.weightKg },
      })
    }

    return created
  })

  return {
    ...measurement,
    weightKg: measurement.weightKg ? Number(measurement.weightKg) : null,
    bodyFatPct: measurement.bodyFatPct ? Number(measurement.bodyFatPct) : null,
    chestCm: measurement.chestCm ? Number(measurement.chestCm) : null,
    waistCm: measurement.waistCm ? Number(measurement.waistCm) : null,
    hipCm: measurement.hipCm ? Number(measurement.hipCm) : null,
    armCm: measurement.armCm ? Number(measurement.armCm) : null,
    thighCm: measurement.thighCm ? Number(measurement.thighCm) : null,
  }
}

export async function getProgressSummary(studentId: string) {
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const [weeklyCompleted, totalCompleted, recentSessions, measurements, completedLogs] =
    await Promise.all([
      prisma.workoutSession.count({
        where: {
          studentId,
          status: 'COMPLETED',
          completedAt: { gte: startOfWeek },
        },
      }),
      prisma.workoutSession.count({
        where: { studentId, status: 'COMPLETED' },
      }),
      prisma.workoutSession.findMany({
        where: { studentId, status: { in: ['COMPLETED', 'SKIPPED'] } },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          _count: { select: { setLogs: true } },
        },
      }),
      prisma.bodyMeasurement.findMany({
        where: { studentId },
        orderBy: { recordedAt: 'asc' },
        take: 24,
      }),
      prisma.exerciseSetLog.findMany({
        where: {
          isCompleted: true,
          weightKg: { not: null },
          session: { studentId, status: 'COMPLETED' },
        },
        include: {
          session: { select: { completedAt: true, startedAt: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
    ])

  // Agrupar carga máxima por fecha y ejercicio para gráficos
  const loadMap = new Map<string, { date: string; maxWeightKg: number; volume: number }>()
  for (const log of completedLogs) {
    const dt = (log.session.completedAt ?? log.session.startedAt)
      .toISOString()
      .slice(0, 10)
    const w = Number(log.weightKg ?? 0)
    const vol = w * log.repsCompleted
    const prev = loadMap.get(dt)
    if (!prev) {
      loadMap.set(dt, { date: dt, maxWeightKg: w, volume: vol })
    } else {
      loadMap.set(dt, {
        date: dt,
        maxWeightKg: Math.max(prev.maxWeightKg, w),
        volume: prev.volume + vol,
      })
    }
  }

  return {
    weeklyCompleted,
    totalCompleted,
    recentSessions: recentSessions.map((s) => ({
      id: s.id,
      dayTitleSnap: s.dayTitleSnap,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      status: s.status,
      studentNotes: s.studentNotes,
      setsCount: s._count.setLogs,
    })),
    measurements: measurements.map((m) => ({
      id: m.id,
      recordedAt: m.recordedAt,
      weightKg: m.weightKg ? Number(m.weightKg) : null,
      bodyFatPct: m.bodyFatPct ? Number(m.bodyFatPct) : null,
      waistCm: m.waistCm ? Number(m.waistCm) : null,
      notes: m.notes,
    })),
    loadProgression: Array.from(loadMap.values()),
  }
}
