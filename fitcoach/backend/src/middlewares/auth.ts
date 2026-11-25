import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '@prisma/client'
import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/errors.js'
import { verifySessionToken, type SessionPayload } from '../utils/tokens.js'

declare global {
  namespace Express {
    interface Request {
      auth?: SessionPayload
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[env.COOKIE_NAME] as string | undefined
  if (!token) {
    return next(new AppError('Sesión no iniciada', 401, 'UNAUTHORIZED'))
  }

  try {
    const payload = verifySessionToken(token)
    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        role: true,
        studentProfile: { select: { id: true } },
      },
    })

    if (!user) {
      return next(new AppError('Sesión inválida o expirada', 401, 'UNAUTHORIZED'))
    }

    req.auth = {
      sub: user.id,
      role: user.role,
      studentId: user.studentProfile?.id,
    }
    return next()
  } catch {
    return next(new AppError('Sesión inválida o expirada', 401, 'UNAUTHORIZED'))
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new AppError('Sesión no iniciada', 401, 'UNAUTHORIZED'))
    }
    if (!roles.includes(req.auth.role)) {
      return next(
        new AppError('No tenés permisos para esta acción', 403, 'FORBIDDEN'),
      )
    }
    return next()
  }
}

/**
 * Garantiza que un alumno solo pueda acceder a su propio recurso.
 * El entrenador tiene acceso completo.
 */
export function requireStudentAccess(paramName = 'id') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new AppError('Sesión no iniciada', 401, 'UNAUTHORIZED'))
    }
    if (req.auth.role === 'TRAINER') {
      return next()
    }
    const targetStudentId = req.params[paramName]
    if (!req.auth.studentId || req.auth.studentId !== targetStudentId) {
      return next(
        new AppError('No podés acceder a datos de otro alumno', 403, 'FORBIDDEN'),
      )
    }
    return next()
  }
}
