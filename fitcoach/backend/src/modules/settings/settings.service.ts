import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/errors.js'

const PUBLIC_TRAINER_SELECT = {
  id: true,
  slug: true,
  firstName: true,
  lastName: true,
  headline: true,
  bio: true,
  philosophy: true,
  experienceYears: true,
  certifications: true,
  whatsapp: true,
  instagram: true,
  avatarUrl: true,
} as const

export async function getPublicSettings(slug?: string) {
  const trainer = slug
    ? await prisma.trainerProfile.findUnique({
        where: { slug },
        select: PUBLIC_TRAINER_SELECT,
      })
    : await prisma.trainerProfile.findFirst({
        orderBy: { createdAt: 'asc' },
        select: PUBLIC_TRAINER_SELECT,
      })

  if (!trainer) {
    throw new AppError('Entrenador no encontrado', 404, 'TRAINER_NOT_FOUND')
  }

  const [site, plans] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { trainerId: trainer.id } }),
    prisma.servicePlan.findMany({
      where: { trainerId: trainer.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return { site, trainer, plans }
}

export async function listPublicCoaches() {
  const coaches = await prisma.trainerProfile.findMany({
    where: {
      user: { isActive: true, deletedAt: null },
    },
    select: {
      slug: true,
      firstName: true,
      lastName: true,
      headline: true,
      experienceYears: true,
      siteSettings: {
        select: {
          brandName: true,
          tagline: true,
          location: true,
          primaryColor: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 24,
  })

  return coaches
}

export async function getTrainerSettings(trainerId: string) {
  const [site, trainer, plans] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { trainerId } }),
    prisma.trainerProfile.findUnique({ where: { id: trainerId } }),
    prisma.servicePlan.findMany({
      where: { trainerId },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return { site, trainer, plans }
}

export async function updateSiteSettings(
  trainerId: string,
  data: {
    brandName?: string
    tagline?: string
    location?: string
    whatsapp?: string
    email?: string
    instagram?: string | null
    primaryColor?: string
    scheduleText?: string | null
    heroImageUrl?: string | null
    heroTitle?: string | null
    heroSubtitle?: string | null
    services?: unknown
    testimonials?: unknown
  },
) {
  return prisma.siteSettings.upsert({
    where: { trainerId },
    update: data as Record<string, unknown>,
    create: {
      trainerId,
      ...(data as Record<string, unknown>),
    },
  })
}

export async function updateTrainerProfile(
  userId: string,
  data: {
    slug?: string
    firstName?: string
    lastName?: string
    headline?: string | null
    bio?: string | null
    philosophy?: string | null
    experienceYears?: number
    whatsapp?: string | null
    instagram?: string | null
    avatarUrl?: string | null
    certifications?: string[]
  },
) {
  const profile = await prisma.trainerProfile.findUnique({
    where: { userId },
    select: { id: true, slug: true },
  })
  if (!profile) {
    throw new AppError('Perfil de entrenador no encontrado', 404, 'NOT_FOUND')
  }

  if (data.slug && data.slug !== profile.slug) {
    const taken = await prisma.trainerProfile.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    })
    if (taken) {
      throw new AppError('Ese enlace ya está en uso por otro entrenador', 409, 'SLUG_EXISTS')
    }
  }

  return prisma.trainerProfile.update({
    where: { userId },
    data,
  })
}

export async function createServicePlan(
  trainerId: string,
  data: {
    name: string
    badge?: string | null
    description?: string | null
    priceArs: number
    modality: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
    features: string[]
    isActive: boolean
  },
) {
  const baseSlug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'plan'
  const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`

  const count = await prisma.servicePlan.count({ where: { trainerId } })

  return prisma.servicePlan.create({
    data: {
      trainerId,
      slug,
      name: data.name,
      badge: data.badge ?? null,
      description: data.description ?? null,
      priceArs: data.priceArs,
      modality: data.modality,
      features: data.features,
      isActive: data.isActive,
      sortOrder: count + 1,
    },
  })
}

export async function updateServicePlan(
  trainerId: string,
  id: string,
  data: {
    name?: string
    badge?: string | null
    description?: string | null
    priceArs?: number
    modality?: 'ONLINE' | 'IN_PERSON' | 'HYBRID'
    features?: string[]
    isActive?: boolean
  },
) {
  const existing = await prisma.servicePlan.findFirst({
    where: { id, trainerId },
    select: { id: true },
  })
  if (!existing) {
    throw new AppError('Plan no encontrado', 404, 'NOT_FOUND')
  }

  return prisma.servicePlan.update({
    where: { id },
    data,
  })
}

export async function deleteServicePlan(trainerId: string, id: string) {
  const existing = await prisma.servicePlan.findFirst({
    where: { id, trainerId },
    select: { id: true },
  })
  if (!existing) {
    throw new AppError('Plan no encontrado', 404, 'NOT_FOUND')
  }
  await prisma.servicePlan.delete({ where: { id } })
  return { deleted: true }
}

export async function getTrainerDashboardMetrics(trainerId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [
    activeStudents,
    newStudentsMonth,
    scheduledTodayCount,
    pendingPaymentsCount,
    pendingPaymentsSum,
    monthIncomeSum,
    completedSessionsMonth,
    upcomingToday,
    recentCompletedWorkouts,
    recentLeads,
  ] = await Promise.all([
    prisma.studentProfile.count({
      where: { trainerId, status: 'ACTIVE', deletedAt: null },
    }),
    prisma.studentProfile.count({
      where: {
        trainerId,
        joinedAt: { gte: monthStart, lte: monthEnd },
        deletedAt: null,
      },
    }),
    prisma.appointment.count({
      where: {
        trainerId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['CANCELLED'] },
      },
    }),
    prisma.payment.count({
      where: { trainerId, status: { in: ['PENDING', 'OVERDUE'] } },
    }),
    prisma.payment.aggregate({
      where: { trainerId, status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { amountArs: true },
    }),
    prisma.payment.aggregate({
      where: {
        trainerId,
        status: 'PAID',
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountArs: true },
    }),
    prisma.workoutSession.count({
      where: {
        student: { trainerId },
        status: 'COMPLETED',
        completedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.appointment.findMany({
      where: {
        trainerId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
    }),
    prisma.workoutSession.findMany({
      where: {
        student: { trainerId },
        status: 'COMPLETED',
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 4,
    }),
    prisma.contactLead.findMany({
      where: { trainerId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ])

  return {
    kpis: {
      activeStudents,
      newStudentsMonth,
      scheduledTodayCount,
      pendingPaymentsCount,
      pendingPaymentsArs: pendingPaymentsSum._sum.amountArs ?? 0,
      monthIncomeArs: monthIncomeSum._sum.amountArs ?? 0,
      completedSessionsMonth,
    },
    upcomingToday,
    recentCompletedWorkouts,
    recentLeads,
  }
}
