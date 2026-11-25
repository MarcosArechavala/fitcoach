import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { requireRole, requireStudentAccess } from '../middlewares/auth.js'
import { createLeadSchema } from '../modules/leads/leads.schema.js'
import { createPaymentSchema } from '../modules/payments/payments.schema.js'
import { createStudentSchema } from '../modules/students/students.schema.js'
import { generateRandomToken, hashToken, signSessionToken, verifySessionToken } from '../utils/tokens.js'

describe('Tokens y hashing', () => {
  it('genera tokens aleatorios cuyo hash SHA-256 coincide', () => {
    const { rawToken, tokenHash } = generateRandomToken()
    assert.equal(rawToken.length, 64)
    assert.equal(hashToken(rawToken), tokenHash)
  })

  it('firma y verifica JWT de sesión con rol y studentId', () => {
    const token = signSessionToken({
      sub: 'user-1',
      role: 'STUDENT',
      studentId: 'student-1',
    })
    const decoded = verifySessionToken(token)
    assert.equal(decoded.sub, 'user-1')
    assert.equal(decoded.role, 'STUDENT')
    assert.equal(decoded.studentId, 'student-1')
  })

  it('rechaza tokens manipulados o con algoritmo none', () => {
    const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'user-1', role: 'TRAINER' })).toString('base64url')
    assert.throws(() => verifySessionToken(`${fakeHeader}.${fakePayload}.`))
  })
})

describe('Autorización por rol y recurso', () => {
  it('bloquea a un STUDENT en rutas exclusivas de TRAINER', () => {
    let capturedErr: unknown
    const middleware = requireRole('TRAINER')
    middleware(
      { auth: { sub: 'u1', role: 'STUDENT', studentId: 's1' } } as never,
      {} as never,
      (err?: unknown) => {
        capturedErr = err
      },
    )
    assert.ok(capturedErr instanceof Error)
    assert.equal((capturedErr as { statusCode?: number }).statusCode, 403)
  })

  it('impide que un alumno acceda a datos de otro alumno', () => {
    let capturedErr: unknown
    const middleware = requireStudentAccess('id')
    middleware(
      {
        auth: { sub: 'u1', role: 'STUDENT', studentId: 'student-A' },
        params: { id: 'student-B' },
      } as never,
      {} as never,
      (err?: unknown) => {
        capturedErr = err
      },
    )
    assert.ok(capturedErr instanceof Error)
    assert.equal((capturedErr as { statusCode?: number }).statusCode, 403)
  })

  it('permite que un alumno acceda a su propio recurso', () => {
    let capturedErr: unknown
    const middleware = requireStudentAccess('id')
    middleware(
      {
        auth: { sub: 'u1', role: 'STUDENT', studentId: 'student-A' },
        params: { id: 'student-A' },
      } as never,
      {} as never,
      (err?: unknown) => {
        capturedErr = err
      },
    )
    assert.equal(capturedErr, undefined)
  })
})

describe('Validaciones Zod', () => {
  it('normaliza email en alta de alumno y rechaza email inválido', () => {
    const valid = createStudentSchema.parse({
      email: '  Alumno@Fitcoach.COM.AR ',
      firstName: 'Lucía',
      lastName: 'Fernández',
    })
    assert.equal(valid.email, 'alumno@fitcoach.com.ar')

    assert.throws(() =>
      createStudentSchema.parse({
        email: 'no-es-email',
        firstName: 'Lucía',
        lastName: 'Fernández',
      }),
    )
  })

  it('rechaza pagos con importe <= 0 y valida leads', () => {
    assert.throws(() =>
      createPaymentSchema.parse({
        studentId: 's1',
        amountArs: 0,
        dueDate: '2026-11-30',
      }),
    )

    const lead = createLeadSchema.parse({
      name: 'Juan',
      email: 'juan@test.com',
      whatsapp: '+54 9 11 5555-0000',
      goal: 'Fuerza',
      message: 'Quiero consultar por el plan presencial.',
    })
    assert.equal(lead.name, 'Juan')
  })
})
