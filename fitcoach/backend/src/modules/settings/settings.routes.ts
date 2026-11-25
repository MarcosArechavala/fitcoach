import { Router } from 'express'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/errors.js'
import {
  planIdParamSchema,
  updatePlanSchema,
  updateSiteSettingsSchema,
  updateTrainerProfileSchema,
} from './settings.schema.js'
import * as settingsService from './settings.service.js'

export const settingsRouter = Router()

// Datos públicos para la Landing Page
settingsRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const data = await settingsService.getPublicSettings()
    res.json(data)
  }),
)

// Rutas privadas del entrenador
settingsRouter.use(requireAuth, requireRole('TRAINER'))

settingsRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const metrics = await settingsService.getTrainerDashboardMetrics()
    res.json(metrics)
  }),
)

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await settingsService.getTrainerSettings()
    res.json(data)
  }),
)

settingsRouter.put(
  '/site',
  validate({ body: updateSiteSettingsSchema }),
  asyncHandler(async (req, res) => {
    const site = await settingsService.updateSiteSettings(req.body)
    res.json({ site })
  }),
)

settingsRouter.put(
  '/trainer',
  validate({ body: updateTrainerProfileSchema }),
  asyncHandler(async (req, res) => {
    const trainer = await settingsService.updateTrainerProfile(
      req.auth!.sub,
      req.body,
    )
    res.json({ trainer })
  }),
)

settingsRouter.patch(
  '/plans/:id',
  validate({ params: planIdParamSchema, body: updatePlanSchema }),
  asyncHandler(async (req, res) => {
    const plan = await settingsService.updateServicePlan(
      req.params.id as string,
      req.body,
    )
    res.json({ plan })
  }),
)
