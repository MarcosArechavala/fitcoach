import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { env } from '../../config/env.js'
import { requireAuth } from '../../middlewares/auth.js'
import { validate } from '../../middlewares/validate.js'
import { asyncHandler } from '../../utils/errors.js'
import { verifySessionToken } from '../../utils/tokens.js'
import {
  acceptInvitationSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerTrainerSchema,
  resetPasswordSchema,
} from './auth.schema.js'
import * as authService from './auth.service.js'

export const authRouter = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos. Esperá unos minutos antes de volver a intentar.',
    },
  },
})

function setSessionCookie(res: import('express').Response, token: string) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

authRouter.post(
  '/register-trainer',
  authLimiter,
  validate({ body: registerTrainerSchema }),
  asyncHandler(async (req, res) => {
    const { token, user } = await authService.registerTrainer(req.body)
    setSessionCookie(res, token)
    res.status(201).json({ user, token })
  }),
)

authRouter.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const { token, user } = await authService.loginWithEmail(email, password)
    setSessionCookie(res, token)
    res.json({ user, token })
  }),
)

authRouter.post(
  '/logout',
  (_req, res) => {
    res.clearCookie(env.COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    })
    res.json({ ok: true })
  },
)

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined
    const token = (req.cookies?.[env.COOKIE_NAME] as string | undefined) || bearerToken

    if (!token) {
      res.json({ user: null })
      return
    }

    try {
      const payload = verifySessionToken(token)
      const user = await authService.getAuthenticatedUser(payload.sub)
      res.json({ user })
    } catch {
      res.json({ user: null })
    }
  }),
)

authRouter.post(
  '/accept-invitation',
  authLimiter,
  validate({ body: acceptInvitationSchema }),
  asyncHandler(async (req, res) => {
    const { token: rawToken, password } = req.body
    const { token, user } = await authService.acceptInvitation(rawToken, password)
    setSessionCookie(res, token)
    res.json({ user, token })
  }),
)

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.requestPasswordReset(req.body.email)
    res.json({
      message:
        'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.',
      ...(result.devResetToken ? { devResetToken: result.devResetToken } : {}),
    })
  }),
)

authRouter.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password)
    res.json({ ok: true })
  }),
)

authRouter.post(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    await authService.changePassword(
      req.auth!.sub,
      req.body.currentPassword,
      req.body.newPassword,
    )
    res.json({ ok: true })
  }),
)
