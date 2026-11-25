import bcrypt from 'bcryptjs'
import { env } from '../../config/env.js'
import { prisma } from '../../config/prisma.js'
import { sendPasswordResetEmail } from '../../utils/email.js'
import { AppError } from '../../utils/errors.js'
import {
  generateRandomToken,
  hashToken,
  signSessionToken,
} from '../../utils/tokens.js'

export interface AuthUserDTO {
  id: string
  email: string
  role: 'TRAINER' | 'STUDENT'
  fullName: string
  studentId?: string
}

function toAuthUserDTO(user: {
  id: string
  email: string
  role: 'TRAINER' | 'STUDENT'
  trainerProfile: { firstName: string; lastName: string } | null
  studentProfile: { id: string; firstName: string; lastName: string } | null
}): AuthUserDTO {
  const fullName =
    user.role === 'TRAINER' && user.trainerProfile
      ? `${user.trainerProfile.firstName} ${user.trainerProfile.lastName}`
      : user.studentProfile
        ? `${user.studentProfile.firstName} ${user.studentProfile.lastName}`
        : user.email

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName,
    studentId: user.studentProfile?.id,
  }
}

export async function loginWithEmail(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email, isActive: true, deletedAt: null },
    include: {
      trainerProfile: { select: { firstName: true, lastName: true } },
      studentProfile: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!user || !user.passwordHash) {
    throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw new AppError('Credenciales inválidas', 401, 'INVALID_CREDENTIALS')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const token = signSessionToken({
    sub: user.id,
    role: user.role,
    studentId: user.studentProfile?.id,
  })

  return {
    token,
    user: toAuthUserDTO(user),
  }
}

export async function getAuthenticatedUser(userId: string): Promise<AuthUserDTO> {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true, deletedAt: null },
    include: {
      trainerProfile: { select: { firstName: true, lastName: true } },
      studentProfile: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!user) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
  }

  return toAuthUserDTO(user)
}

export async function acceptInvitation(rawToken: string, password: string) {
  const tokenHash = hashToken(rawToken)
  const user = await prisma.user.findFirst({
    where: {
      invitationTokenHash: tokenHash,
      invitationExpiresAt: { gt: new Date() },
      deletedAt: null,
    },
    include: {
      trainerProfile: { select: { firstName: true, lastName: true } },
      studentProfile: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!user) {
    throw new AppError(
      'La invitación es inválida o expiró. Pedile una nueva a tu entrenador.',
      400,
      'INVALID_INVITATION',
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isActive: true,
      invitationTokenHash: null,
      invitationExpiresAt: null,
      lastLoginAt: new Date(),
    },
  })

  const token = signSessionToken({
    sub: user.id,
    role: user.role,
    studentId: user.studentProfile?.id,
  })

  return {
    token,
    user: toAuthUserDTO(user),
  }
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findFirst({
    where: { email, isActive: true, deletedAt: null },
    select: { id: true },
  })

  if (!user) {
    return { sent: true }
  }

  const { rawToken, tokenHash } = generateRandomToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetExpiresAt: expiresAt,
    },
  })

  const resetUrl = `${env.FRONTEND_URL}/recuperar-password?token=${rawToken}`
  void sendPasswordResetEmail(email, resetUrl)

  return {
    sent: true,
    devResetToken:
      process.env.NODE_ENV === 'development' ? rawToken : undefined,
  }
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken)
  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetExpiresAt: { gt: new Date() },
      deletedAt: null,
    },
    select: { id: true },
  })

  if (!user) {
    throw new AppError(
      'El enlace de recuperación es inválido o expiró',
      400,
      'INVALID_RESET_TOKEN',
    )
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetExpiresAt: null,
    },
  })

  return { updated: true }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  })

  if (!user || !user.passwordHash) {
    throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!matches) {
    throw new AppError('La contraseña actual no es correcta', 400, 'INVALID_PASSWORD')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  return { updated: true }
}
