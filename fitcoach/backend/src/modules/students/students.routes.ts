import { Router } from 'express'
import {
  requireAuth,
  requireRole,
  requireStudentAccess,
} from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler, AppError } from '../../utils/errors.js'
import {
  createStudentSchema,
  listStudentsQuerySchema,
  studentIdParamSchema,
  updateMyProfileSchema,
  updateStudentSchema,
} from './students.schema.js'
import * as studentsService from './students.service.js'

export const studentsRouter = Router()

studentsRouter.use(requireAuth)

studentsRouter.get(
  '/plans',
  requireRole('TRAINER'),
  asyncHandler(async (req, res) => {
    const plans = await studentsService.listActivePlans(req.auth!.trainerId!)
    res.json({ plans })
  }),
)

studentsRouter.get(
  '/me',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const student = await studentsService.getStudentById(req.auth.studentId)
    res.json({ student })
  }),
)

studentsRouter.patch(
  '/me',
  requireRole('STUDENT'),
  validate({ body: updateMyProfileSchema }),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const student = await studentsService.updateStudent(req.auth.studentId, req.body)
    res.json({ student })
  }),
)

studentsRouter.get(
  '/',
  requireRole('TRAINER'),
  validate({ query: listStudentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const students = await studentsService.listStudents(
      req.auth!.trainerId!,
      req.query as {
        search?: string
        status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
        experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
      },
    )
    res.json({ students })
  }),
)

studentsRouter.post(
  '/',
  requireRole('TRAINER'),
  validate({ body: createStudentSchema }),
  asyncHandler(async (req, res) => {
    const result = await studentsService.createStudent(
      req.auth!.trainerId!,
      req.body,
    )
    res.status(201).json(result)
  }),
)

studentsRouter.get(
  '/:id',
  validate({ params: studentIdParamSchema }),
  requireStudentAccess('id'),
  asyncHandler(async (req, res) => {
    const student = await studentsService.getStudentById(req.params.id as string)
    res.json({ student })
  }),
)

studentsRouter.patch(
  '/:id',
  requireRole('TRAINER'),
  validate({ params: studentIdParamSchema, body: updateStudentSchema }),
  asyncHandler(async (req, res) => {
    const student = await studentsService.updateStudent(req.params.id as string, req.body)
    res.json({ student })
  }),
)

studentsRouter.post(
  '/:id/archive',
  requireRole('TRAINER'),
  validate({ params: studentIdParamSchema }),
  asyncHandler(async (req, res) => {
    const result = await studentsService.archiveStudent(req.params.id as string)
    res.json(result)
  }),
)

studentsRouter.post(
  '/:id/restore',
  requireRole('TRAINER'),
  validate({ params: studentIdParamSchema }),
  asyncHandler(async (req, res) => {
    const student = await studentsService.restoreStudent(req.params.id as string)
    res.json({ student })
  }),
)

studentsRouter.post(
  '/:id/reinvite',
  requireRole('TRAINER'),
  validate({ params: studentIdParamSchema }),
  asyncHandler(async (req, res) => {
    const result = await studentsService.regenerateInvitation(req.params.id as string)
    res.json(result)
  }),
)
