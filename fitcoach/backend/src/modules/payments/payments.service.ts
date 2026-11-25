import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/errors.js'

export async function listPayments(
  trainerId: string,
  filters: {
    status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    studentId?: string
  },
) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [payments, paidThisMonth, pendingTotal] = await Promise.all([
    prisma.payment.findMany({
      where: {
        trainerId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        servicePlan: { select: { id: true, name: true } },
      },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.payment.aggregate({
      where: {
        trainerId,
        status: 'PAID',
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountArs: true },
    }),
    prisma.payment.aggregate({
      where: { trainerId, status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { amountArs: true },
      _count: { id: true },
    }),
  ])

  return {
    payments,
    summary: {
      collectedThisMonthArs: paidThisMonth._sum.amountArs ?? 0,
      pendingAmountArs: pendingTotal._sum.amountArs ?? 0,
      pendingCount: pendingTotal._count.id,
    },
  }
}

export async function createPayment(
  trainerId: string,
  input: {
    studentId: string
    servicePlanId?: string | null
    amountArs: number
    method: 'CASH' | 'TRANSFER' | 'MERCADO_PAGO'
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    dueDate: string
    paidAt?: string | null
    periodLabel?: string | null
    notes?: string | null
  },
) {
  const paidAt =
    input.status === 'PAID'
      ? input.paidAt
        ? new Date(input.paidAt)
        : new Date()
      : null

  return prisma.payment.create({
    data: {
      trainerId,
      studentId: input.studentId,
      servicePlanId: input.servicePlanId ?? null,
      amountArs: input.amountArs,
      method: input.method,
      status: input.status,
      dueDate: new Date(input.dueDate),
      paidAt,
      periodLabel: input.periodLabel ?? null,
      notes: input.notes ?? null,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      servicePlan: { select: { id: true, name: true } },
    },
  })
}

export async function updatePayment(
  trainerId: string,
  id: string,
  input: {
    status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    method?: 'CASH' | 'TRANSFER' | 'MERCADO_PAGO'
    paidAt?: string | null
    notes?: string | null
  },
) {
  const existing = await prisma.payment.findFirst({ where: { id, trainerId } })
  if (!existing) throw new AppError('Pago no encontrado', 404, 'NOT_FOUND')

  const nextPaidAt =
    input.status === 'PAID' && !existing.paidAt
      ? new Date()
      : input.paidAt !== undefined
        ? input.paidAt
          ? new Date(input.paidAt)
          : null
        : existing.paidAt

  return prisma.payment.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.method !== undefined ? { method: input.method } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      paidAt: nextPaidAt,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      servicePlan: { select: { id: true, name: true } },
    },
  })
}
