import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/errors.js'

export async function createLead(input: {
  name: string
  email: string
  whatsapp: string
  goal: string
  message: string
}) {
  return prisma.contactLead.create({
    data: {
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      goal: input.goal,
      message: input.message,
      status: 'NEW',
    },
  })
}

export async function listLeads(status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'DISCARDED') {
  return prisma.contactLead.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateLead(
  id: string,
  input: {
    status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'DISCARDED'
    notes?: string | null
  },
) {
  const existing = await prisma.contactLead.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw new AppError('Consulta no encontrada', 404, 'NOT_FOUND')

  return prisma.contactLead.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  })
}
