import type { Prisma } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../config/prisma.js'
import { sendInvitationEmail } from '../../utils/email.js'
import { AppError } from '../../utils/errors.js'
import { generateRandomToken } from '../../utils/tokens.js'

function serializeStudent(
  student: Prisma.StudentProfileGetPayload<{
    include: {
      user: { select: { email: true; isActive: true; lastLoginAt: true; invitationExpiresAt: true } }
      subscriptions: {
        where: { status: 'ACTIVE' }
        include: { servicePlan: { select: { id: true; name: true; priceArs: true } } }
        take: 1
      }
    }
  }>,
) {
  const activeSub = student.subscriptions[0] ?? null
  return {
    id: student.id,
    userId: student.userId,
    email: student.user.email,
    firstName: student.firstName,
    lastName: student.lastName,
    phone: student.phone,
    birthDate: student.birthDate,
    heightCm: student.heightCm,
    currentWeightKg: student.currentWeightKg ? Number(student.currentWeightKg) : null,
    goal: student.goal,
    experienceLevel: student.experienceLevel,
    status: student.status,
    joinedAt: student.joinedAt,
    notes: student.notes,
    isAccountActivated: Boolean(student.user.lastLoginAt) || !student.user.invitationExpiresAt,
    activePlan: activeSub
      ? {
          id: activeSub.servicePlan.id,
          name: activeSub.servicePlan.name,
          priceArs: activeSub.customPriceArs ?? activeSub.servicePlan.priceArs,
        }
      : null,
  }
}

const studentInclude = {
  user: {
    select: {
      email: true,
      isActive: true,
      lastLoginAt: true,
      invitationExpiresAt: true,
    },
  },
  subscriptions: {
    where: { status: 'ACTIVE' as const },
    include: {
      servicePlan: { select: { id: true, name: true, priceArs: true } },
    },
    take: 1,
  },
} satisfies Prisma.StudentProfileInclude

export async function listStudents(filters: {
  search?: string
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
}) {
  const where: Prisma.StudentProfileWhereInput = {
    ...(filters.status ? { status: filters.status } : { status: { not: 'ARCHIVED' } }),
    ...(filters.experienceLevel ? { experienceLevel: filters.experienceLevel } : {}),
    ...(filters.search
      ? {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { goal: { contains: filters.search, mode: 'insensitive' } },
            { user: { email: { contains: filters.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }

  const students = await prisma.studentProfile.findMany({
    where,
    include: studentInclude,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  return students.map(serializeStudent)
}

export async function getStudentById(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: studentInclude,
  })

  if (!student) {
    throw new AppError('Alumno no encontrado', 404, 'NOT_FOUND')
  }

  return serializeStudent(student)
}

export async function createStudent(input: {
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  birthDate?: string | null
  heightCm?: number | null
  currentWeightKg?: number | null
  goal?: string | null
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  servicePlanId?: string | null
  notes?: string | null
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  })
  if (existing) {
    throw new AppError('Ya existe un usuario registrado con ese email', 409, 'EMAIL_EXISTS')
  }

  const { rawToken, tokenHash } = generateRandomToken()
  const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        role: 'STUDENT',
        isActive: false,
        invitationTokenHash: tokenHash,
        invitationExpiresAt,
      },
    })

    const student = await tx.studentProfile.create({
      data: {
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        heightCm: input.heightCm ?? null,
        currentWeightKg: input.currentWeightKg ?? null,
        goal: input.goal ?? null,
        experienceLevel: input.experienceLevel,
        notes: input.notes ?? null,
      },
    })

    if (input.servicePlanId) {
      await tx.studentSubscription.create({
        data: {
          studentId: student.id,
          servicePlanId: input.servicePlanId,
          status: 'ACTIVE',
        },
      })
    }

    return tx.studentProfile.findUniqueOrThrow({
      where: { id: student.id },
      include: studentInclude,
    })
  })

  const invitationUrl = `${env.FRONTEND_URL}/invitacion?token=${rawToken}`
  void sendInvitationEmail(input.email, input.firstName, invitationUrl)

  return {
    student: serializeStudent(created),
    invitationUrl,
  }
}

export async function updateStudent(
  studentId: string,
  input: {
    firstName?: string
    lastName?: string
    phone?: string | null
    birthDate?: string | null
    heightCm?: number | null
    currentWeightKg?: number | null
    goal?: string | null
    experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
    servicePlanId?: string | null
    notes?: string | null
  },
) {
  const existing = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { id: true },
  })

  if (!existing) {
    throw new AppError('Alumno no encontrado', 404, 'NOT_FOUND')
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.studentProfile.update({
      where: { id: studentId },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.birthDate !== undefined
          ? { birthDate: input.birthDate ? new Date(input.birthDate) : null }
          : {}),
        ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
        ...(input.currentWeightKg !== undefined
          ? { currentWeightKg: input.currentWeightKg }
          : {}),
        ...(input.goal !== undefined ? { goal: input.goal } : {}),
        ...(input.experienceLevel !== undefined
          ? { experienceLevel: input.experienceLevel }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    })

    if (input.servicePlanId !== undefined) {
      await tx.studentSubscription.updateMany({
        where: { studentId, status: 'ACTIVE' },
        data: { status: 'CANCELLED', endDate: new Date() },
      })
      if (input.servicePlanId) {
        await tx.studentSubscription.create({
          data: {
            studentId,
            servicePlanId: input.servicePlanId,
            status: 'ACTIVE',
          },
        })
      }
    }

    return tx.studentProfile.findUniqueOrThrow({
      where: { id: studentId },
      include: studentInclude,
    })
  })

  return serializeStudent(updated)
}

export async function archiveStudent(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true },
  })

  if (!student) {
    throw new AppError('Alumno no encontrado', 404, 'NOT_FOUND')
  }

  await prisma.$transaction([
    prisma.studentProfile.update({
      where: { id: studentId },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: student.userId },
      data: { isActive: false },
    }),
  ])

  return { archived: true }
}

export async function restoreStudent(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true },
  })

  if (!student) {
    throw new AppError('Alumno no encontrado', 404, 'NOT_FOUND')
  }

  await prisma.$transaction([
    prisma.studentProfile.update({
      where: { id: studentId },
      data: { status: 'ACTIVE', deletedAt: null },
    }),
    prisma.user.update({
      where: { id: student.userId },
      data: { isActive: true },
    }),
  ])

  return getStudentById(studentId)
}

export async function regenerateInvitation(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: {
      userId: true,
      firstName: true,
      user: { select: { email: true } },
    },
  })

  if (!student) {
    throw new AppError('Alumno no encontrado', 404, 'NOT_FOUND')
  }

  const { rawToken, tokenHash } = generateRandomToken()
  const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: student.userId },
    data: {
      invitationTokenHash: tokenHash,
      invitationExpiresAt,
    },
  })

  const invitationUrl = `${env.FRONTEND_URL}/invitacion?token=${rawToken}`
  void sendInvitationEmail(student.user.email, student.firstName, invitationUrl)

  return {
    invitationUrl,
  }
}

export async function listActivePlans() {
  return prisma.servicePlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, priceArs: true, modality: true },
  })
}
