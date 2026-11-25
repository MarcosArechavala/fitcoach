import { prisma } from '../../config/prisma.js'
import { sendNewLeadEmail } from '../../utils/email.js'
import { AppError } from '../../utils/errors.js'

export async function createLead(input: {
  trainerSlug?: string
  name: string
  email: string
  whatsapp: string
  goal: string
  message: string
}) {
  const trainer = input.trainerSlug
    ? await prisma.trainerProfile.findUnique({
        where: { slug: input.trainerSlug },
        select: {
          id: true,
          user: { select: { email: true } },
          siteSettings: { select: { email: true } },
        },
      })
    : await prisma.trainerProfile.findFirst({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          user: { select: { email: true } },
          siteSettings: { select: { email: true } },
        },
      })

  const lead = await prisma.contactLead.create({
    data: {
      trainerId: trainer?.id ?? null,
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      goal: input.goal,
      message: input.message,
      status: 'NEW',
    },
  })

  const notifyEmail = trainer?.user?.email ?? trainer?.siteSettings?.email
  if (notifyEmail) {
    void sendNewLeadEmail(notifyEmail, input)
  }

  return lead
}

export async function listLeads(
  trainerId: string,
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'DISCARDED',
) {
  return prisma.contactLead.findMany({
    where: {
      trainerId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateLead(
  trainerId: string,
  id: string,
  input: {
    status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'DISCARDED'
    notes?: string | null
  },
) {
  const existing = await prisma.contactLead.findFirst({
    where: { id, trainerId },
    select: { id: true },
  })
  if (!existing) throw new AppError('Consulta no encontrada', 404, 'NOT_FOUND')

  return prisma.contactLead.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  })
}
