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

// Listado público de entrenadores para la plataforma
settingsRouter.get(
  '/public/coaches',
  asyncHandler(async (_req, res) => {
    const coaches = await settingsService.listPublicCoaches()
    res.json({ coaches })
  }),
)

// Datos públicos para la Landing Page de un entrenador específico por slug
settingsRouter.get(
  '/public/:slug',
  asyncHandler(async (req, res) => {
    const data = await settingsService.getPublicSettings(req.params.slug as string)
    res.json(data)
  }),
)

// Datos públicos (fallback primer entrenador)
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
  asyncHandler(async (req, res) => {
    const metrics = await settingsService.getTrainerDashboardMetrics(
      req.auth!.trainerId!,
    )
    res.json(metrics)
  }),
)

settingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await settingsService.getTrainerSettings(req.auth!.trainerId!)
    res.json(data)
  }),
)

settingsRouter.put(
  '/site',
  validate({ body: updateSiteSettingsSchema }),
  asyncHandler(async (req, res) => {
    const site = await settingsService.updateSiteSettings(
      req.auth!.trainerId!,
      req.body,
    )
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
      req.auth!.trainerId!,
      req.params.id as string,
      req.body,
    )
    res.json({ plan })
  }),
)
