import { Router } from 'express'
import {
  requireAuth,
  requireRole,
  requireStudentAccess,
} from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { AppError, asyncHandler } from '../../utils/errors.js'
import {
  addDaySchema,
  addWorkoutExerciseSchema,
  assignWorkoutSchema,
  createTemplateSchema,
  dayIdParamSchema,
  duplicateDaySchema,
  idParamSchema,
  itemIdParamSchema,
  reorderExercisesSchema,
  studentIdParamSchema,
  updateDaySchema,
  updateTemplateSchema,
  updateWorkoutExerciseSchema,
} from './workouts.schema.js'
import * as workoutsService from './workouts.service.js'

export const workoutsRouter = Router()

workoutsRouter.use(requireAuth)

// Portal del alumno: rutina activa propia
workoutsRouter.get(
  '/my-routine',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    if (!req.auth?.studentId) {
      throw new AppError('Perfil de alumno no encontrado', 404, 'NOT_FOUND')
    }
    const routine = await workoutsService.getStudentActiveRoutine(req.auth.studentId)
    res.json({ routine })
  }),
)

// Consulta de rutina activa por studentId (entrenador o alumno propietario)
workoutsRouter.get(
  '/student/:studentId',
  validate({ params: studentIdParamSchema }),
  requireStudentAccess('studentId'),
  asyncHandler(async (req, res) => {
    const routine = await workoutsService.getStudentActiveRoutine(
      req.params.studentId as string,
    )
    res.json({ routine })
  }),
)

// Rutas exclusivas del entrenador
workoutsRouter.get(
  '/templates',
  requireRole('TRAINER'),
  asyncHandler(async (_req, res) => {
    const templates = await workoutsService.listTemplates()
    res.json({ templates })
  }),
)

workoutsRouter.post(
  '/templates',
  requireRole('TRAINER'),
  validate({ body: createTemplateSchema }),
  asyncHandler(async (req, res) => {
    const template = await workoutsService.createTemplate(req.body)
    res.status(201).json({ template })
  }),
)

workoutsRouter.get(
  '/templates/:id',
  requireRole('TRAINER'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const template = await workoutsService.getTemplateById(req.params.id as string)
    res.json({ template })
  }),
)

workoutsRouter.patch(
  '/templates/:id',
  requireRole('TRAINER'),
  validate({ params: idParamSchema, body: updateTemplateSchema }),
  asyncHandler(async (req, res) => {
    const template = await workoutsService.updateTemplate(
      req.params.id as string,
      req.body,
    )
    res.json({ template })
  }),
)

workoutsRouter.delete(
  '/templates/:id',
  requireRole('TRAINER'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const result = await workoutsService.deleteTemplate(req.params.id as string)
    res.json(result)
  }),
)

workoutsRouter.post(
  '/templates/:id/days',
  requireRole('TRAINER'),
  validate({ params: idParamSchema, body: addDaySchema }),
  asyncHandler(async (req, res) => {
    const day = await workoutsService.addDay(req.params.id as string, req.body)
    res.status(201).json({ day })
  }),
)

workoutsRouter.patch(
  '/days/:dayId',
  requireRole('TRAINER'),
  validate({ params: dayIdParamSchema, body: updateDaySchema }),
  asyncHandler(async (req, res) => {
    const day = await workoutsService.updateDay(req.params.dayId as string, req.body)
    res.json({ day })
  }),
)

workoutsRouter.delete(
  '/days/:dayId',
  requireRole('TRAINER'),
  validate({ params: dayIdParamSchema }),
  asyncHandler(async (req, res) => {
    const result = await workoutsService.deleteDay(req.params.dayId as string)
    res.json(result)
  }),
)

workoutsRouter.post(
  '/days/:dayId/duplicate',
  requireRole('TRAINER'),
  validate({ params: dayIdParamSchema, body: duplicateDaySchema }),
  asyncHandler(async (req, res) => {
    const day = await workoutsService.duplicateDay(req.params.dayId as string, req.body)
    res.status(201).json({ day })
  }),
)

workoutsRouter.post(
  '/days/:dayId/exercises',
  requireRole('TRAINER'),
  validate({ params: dayIdParamSchema, body: addWorkoutExerciseSchema }),
  asyncHandler(async (req, res) => {
    const item = await workoutsService.addExerciseToDay(
      req.params.dayId as string,
      req.body,
    )
    res.status(201).json({ item })
  }),
)

workoutsRouter.put(
  '/days/:dayId/reorder',
  requireRole('TRAINER'),
  validate({ params: dayIdParamSchema, body: reorderExercisesSchema }),
  asyncHandler(async (req, res) => {
    const result = await workoutsService.reorderDayExercises(
      req.params.dayId as string,
      req.body.orderedItemIds,
    )
    res.json(result)
  }),
)

workoutsRouter.patch(
  '/items/:itemId',
  requireRole('TRAINER'),
  validate({ params: itemIdParamSchema, body: updateWorkoutExerciseSchema }),
  asyncHandler(async (req, res) => {
    const item = await workoutsService.updateWorkoutExercise(
      req.params.itemId as string,
      req.body,
    )
    res.json({ item })
  }),
)

workoutsRouter.delete(
  '/items/:itemId',
  requireRole('TRAINER'),
  validate({ params: itemIdParamSchema }),
  asyncHandler(async (req, res) => {
    const result = await workoutsService.deleteWorkoutExercise(req.params.itemId as string)
    res.json(result)
  }),
)

workoutsRouter.post(
  '/assign',
  requireRole('TRAINER'),
  validate({ body: assignWorkoutSchema }),
  asyncHandler(async (req, res) => {
    const assignment = await workoutsService.assignTemplateToStudent(req.body)
    res.status(201).json({ assignment })
  }),
)
