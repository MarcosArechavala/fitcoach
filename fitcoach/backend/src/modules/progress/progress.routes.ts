import { Router } from 'express'
import {
  requireAuth,
  requireRole,
  requireStudentAccess,
} from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { AppError, asyncHandler } from '../../utils/errors.js'
import {
  completeSessionSchema,
  createMeasurementSchema,
  logSetSchema,
  sessionIdParamSchema,
  startSessionSchema,
  studentIdParamSchema,
} from './progress.schema.js'
import * as progressService from './progress.service.js'

export const progressRouter = Router()

progressRouter.use(requireAuth)

progressRouter.get(
  '/sessions/active',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const session = await progressService.getActiveSession(req.auth.studentId)
    res.json({ session })
  }),
)

progressRouter.post(
  '/sessions/start',
  requireRole('STUDENT'),
  validate({ body: startSessionSchema }),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const session = await progressService.startSession(req.auth.studentId, req.body)
    res.status(201).json({ session })
  }),
)

progressRouter.post(
  '/sessions/:sessionId/sets',
  requireRole('STUDENT'),
  validate({ params: sessionIdParamSchema, body: logSetSchema }),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const setLog = await progressService.logSet(
      req.auth.studentId,
      req.params.sessionId as string,
      req.body,
    )
    res.status(201).json({ setLog })
  }),
)

progressRouter.post(
  '/sessions/:sessionId/complete',
  requireRole('STUDENT'),
  validate({ params: sessionIdParamSchema, body: completeSessionSchema }),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const session = await progressService.completeSession(
      req.auth.studentId,
      req.params.sessionId as string,
      req.body,
    )
    res.json({ session })
  }),
)

progressRouter.get(
  '/me',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const summary = await progressService.getProgressSummary(req.auth.studentId)
    res.json(summary)
  }),
)

progressRouter.post(
  '/measurements',
  requireRole('STUDENT'),
  validate({ body: createMeasurementSchema }),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const measurement = await progressService.createMeasurement(
      req.auth.studentId,
      req.body,
    )
    res.status(201).json({ measurement })
  }),
)

progressRouter.get(
  '/students/:studentId',
  validate({ params: studentIdParamSchema }),
  requireStudentAccess('studentId'),
  asyncHandler(async (req, res) => {
    const summary = await progressService.getProgressSummary(
      req.params.studentId as string,
    )
    res.json(summary)
  }),
)

progressRouter.post(
  '/students/:studentId/measurements',
  requireRole('TRAINER'),
  validate({ params: studentIdParamSchema, body: createMeasurementSchema }),
  asyncHandler(async (req, res) => {
    const measurement = await progressService.createMeasurement(
      req.params.studentId as string,
      req.body,
    )
    res.status(201).json({ measurement })
  }),
)
