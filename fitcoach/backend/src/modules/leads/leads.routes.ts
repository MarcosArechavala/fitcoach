import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/errors.js'
import {
  createLeadSchema,
  leadIdParamSchema,
  updateLeadSchema,
} from './leads.schema.js'
import * as leadsService from './leads.service.js'

export const leadsRouter = Router()

const publicLeadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
})

// Endpoint público desde la Landing Page
leadsRouter.post(
  '/',
  publicLeadLimiter,
  validate({ body: createLeadSchema }),
  asyncHandler(async (req, res) => {
    const lead = await leadsService.createLead(req.body)
    res.status(201).json({ lead: { id: lead.id } })
  }),
)

// Gestión privada del entrenador
leadsRouter.get(
  '/',
  requireAuth,
  requireRole('TRAINER'),
  asyncHandler(async (req, res) => {
    const status = req.query.status as
      | 'NEW'
      | 'CONTACTED'
      | 'CONVERTED'
      | 'DISCARDED'
      | undefined
    const leads = await leadsService.listLeads(req.auth!.trainerId!, status)
    res.json({ leads })
  }),
)

leadsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('TRAINER'),
  validate({ params: leadIdParamSchema, body: updateLeadSchema }),
  asyncHandler(async (req, res) => {
    const lead = await leadsService.updateLead(
      req.auth!.trainerId!,
      req.params.id as string,
      req.body,
    )
    res.json({ lead })
  }),
)
