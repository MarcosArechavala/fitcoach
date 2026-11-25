import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth.js'
import { asyncHandler } from '../../utils/errors.js'
import * as notificationsService from './notifications.service.js'

export const notificationsRouter = Router()

notificationsRouter.use(requireAuth)

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (req.auth!.role === 'TRAINER' && req.auth!.trainerId) {
      const data = await notificationsService.getTrainerNotifications(
        req.auth!.trainerId,
      )
      res.json(data)
      return
    }

    if (req.auth!.studentId) {
      const data = await notificationsService.getStudentNotifications(
        req.auth!.studentId,
      )
      res.json(data)
      return
    }

    res.json({ items: [], unreadCount: 0 })
  }),
)
