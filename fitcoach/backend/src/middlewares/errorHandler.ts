import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: err.flatten().fieldErrors,
      },
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Ya existe un registro con esos datos',
        },
      })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Registro no encontrado',
        },
      })
      return
    }
  }

  if (env.NODE_ENV === 'development') {
    console.error('Error no controlado:', err instanceof Error ? err.message : err)
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error inesperado en el servidor',
    },
  })
}
