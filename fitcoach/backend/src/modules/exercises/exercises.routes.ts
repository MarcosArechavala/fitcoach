import { Router } from 'express'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/errors.js'
import {
  createExerciseSchema,
  exerciseIdParamSchema,
  listExercisesQuerySchema,
  updateExerciseSchema,
} from './exercises.schema.js'
import * as exercisesService from './exercises.service.js'

export const exercisesRouter = Router()

exercisesRouter.use(requireAuth, requireRole('TRAINER'))

exercisesRouter.get(
  '/',
  validate({ query: listExercisesQuerySchema }),
  asyncHandler(async (req, res) => {
    const exercises = await exercisesService.listExercises(
      req.query as {
        search?: string
        muscleGroup?: string
        difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
        includeArchived?: string
      },
    )
    res.json({ exercises })
  }),
)

exercisesRouter.post(
  '/',
  validate({ body: createExerciseSchema }),
  asyncHandler(async (req, res) => {
    const exercise = await exercisesService.createExercise(req.body)
    res.status(201).json({ exercise })
  }),
)

exercisesRouter.patch(
  '/:id',
  validate({ params: exerciseIdParamSchema, body: updateExerciseSchema }),
  asyncHandler(async (req, res) => {
    const exercise = await exercisesService.updateExercise(
      req.params.id as string,
      req.body,
    )
    res.json({ exercise })
  }),
)
