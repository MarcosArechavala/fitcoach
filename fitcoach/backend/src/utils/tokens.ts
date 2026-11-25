import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { UserRole } from '@prisma/client'
import { env } from '../config/env.js'

export interface SessionPayload {
  sub: string
  role: UserRole
  studentId?: string
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'],
  }) as SessionPayload
}

export function generateRandomToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  return { rawToken, tokenHash }
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}
