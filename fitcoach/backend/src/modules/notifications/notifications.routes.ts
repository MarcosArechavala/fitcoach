import { Router } from 'express'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { asyncHandler } from '../../utils/errors.js'
import * as notificationsService from './notifications.service.js'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth, requireRole('TRAINER'))

notificationsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await notificationsService.getTrainerNotifications()
    res.json(data)
  }),
)
