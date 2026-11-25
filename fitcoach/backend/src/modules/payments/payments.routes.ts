import { Router } from 'express'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/errors.js'
import {
  createPaymentSchema,
  listPaymentsQuerySchema,
  paymentIdParamSchema,
  updatePaymentSchema,
} from './payments.schema.js'
import * as paymentsService from './payments.service.js'

export const paymentsRouter = Router()

paymentsRouter.use(requireAuth, requireRole('TRAINER'))

paymentsRouter.get(
  '/',
  validate({ query: listPaymentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const data = await paymentsService.listPayments(
      req.auth!.trainerId!,
      req.query as {
        status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
        studentId?: string
      },
    )
    res.json(data)
  }),
)

paymentsRouter.post(
  '/',
  validate({ body: createPaymentSchema }),
  asyncHandler(async (req, res) => {
    const payment = await paymentsService.createPayment(
      req.auth!.trainerId!,
      req.body,
    )
    res.status(201).json({ payment })
  }),
)

paymentsRouter.patch(
  '/:id',
  validate({ params: paymentIdParamSchema, body: updatePaymentSchema }),
  asyncHandler(async (req, res) => {
    const payment = await paymentsService.updatePayment(
      req.auth!.trainerId!,
      req.params.id as string,
      req.body,
    )
    res.json({ payment })
  }),
)
