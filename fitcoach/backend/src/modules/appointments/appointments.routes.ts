import { Router } from 'express'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { AppError, asyncHandler } from '../../utils/errors.js'
import {
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from './appointments.schema.js'
import * as appointmentsService from './appointments.service.js'

export const appointmentsRouter = Router()

appointmentsRouter.use(requireAuth)

appointmentsRouter.get(
  '/my-sessions',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const appointments = await appointmentsService.listStudentAppointments(
      req.auth.studentId,
    )
    res.json({ appointments })
  }),
)

appointmentsRouter.get(
  '/',
  requireRole('TRAINER'),
  validate({ query: listAppointmentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const appointments = await appointmentsService.listAppointments(
      req.query as {
        from?: string
        to?: string
        status?: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
      },
    )
    res.json({ appointments })
  }),
)

appointmentsRouter.post(
  '/',
  requireRole('TRAINER'),
  validate({ body: createAppointmentSchema }),
  asyncHandler(async (req, res) => {
    const appointment = await appointmentsService.createAppointment(req.body)
    res.status(201).json({ appointment })
  }),
)

appointmentsRouter.patch(
  '/:id',
  requireRole('TRAINER'),
  validate({ params: appointmentIdParamSchema, body: updateAppointmentSchema }),
  asyncHandler(async (req, res) => {
    const appointment = await appointmentsService.updateAppointment(
      req.params.id as string,
      req.body,
    )
    res.json({ appointment })
  }),
)
