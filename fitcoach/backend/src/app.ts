import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { appointmentsRouter } from './modules/appointments/appointments.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { exercisesRouter } from './modules/exercises/exercises.routes.js'
import { leadsRouter } from './modules/leads/leads.routes.js'
import { notificationsRouter } from './modules/notifications/notifications.routes.js'
import { paymentsRouter } from './modules/payments/payments.routes.js'
import { progressRouter } from './modules/progress/progress.routes.js'
import { settingsRouter } from './modules/settings/settings.routes.js'
import { studentsRouter } from './modules/students/students.routes.js'
import { workoutsRouter } from './modules/workouts/workouts.routes.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  // Protección CSRF adicional por verificación de Origin en mutaciones
  app.use((req, res, next) => {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
    const origin = req.headers.origin
    if (isMutation && origin && origin !== env.FRONTEND_URL) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Origen no autorizado',
        },
      })
      return
    }
    next()
  })

  // Rate limit global para la API
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'fitcoach-api',
      timezone: 'America/Argentina/Buenos_Aires',
    })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/students', studentsRouter)
  app.use('/api/exercises', exercisesRouter)
  app.use('/api/workouts', workoutsRouter)
  app.use('/api/progress', progressRouter)
  app.use('/api/appointments', appointmentsRouter)
  app.use('/api/payments', paymentsRouter)
  app.use('/api/leads', leadsRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/settings', settingsRouter)

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Ruta no encontrada',
      },
    })
  })

  app.use(errorHandler)

  return app
}
