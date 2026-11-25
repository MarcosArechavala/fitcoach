import 'dotenv/config'
import { z } from 'zod'

const normalizeUrl = (val: unknown) => {
  if (typeof val !== 'string') return val
  let clean = val.trim().replace(/^["']+|["']+$/g, '')
  if (!clean) return undefined
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`
  }
  return clean.replace(/\/+$/, '')
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.preprocess(
    normalizeUrl,
    z.string().url('FRONTEND_URL debe ser una URL válida (ej: https://tu-app.vercel.app)').default('http://localhost:5173'),
  ),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('fitcoach_session'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    'Configuración de entorno inválida:',
    parsed.error.flatten().fieldErrors,
  )
  process.exit(1)
}

export const env = parsed.data
