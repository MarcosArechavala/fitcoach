import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/errors.js'

export async function getPublicSettings() {
  const [site, trainer, plans] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'default' } }),
    prisma.trainerProfile.findFirst({
      select: {
        firstName: true,
        lastName: true,
        headline: true,
        bio: true,
        philosophy: true,
        experienceYears: true,
        certifications: true,
        whatsapp: true,
        instagram: true,
      },
    }),
    prisma.servicePlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return { site, trainer, plans }
}

export async function getTrainerSettings() {
  const [site, trainer, plans] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'default' } }),
    prisma.trainerProfile.findFirst(),
    prisma.servicePlan.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  return { site, trainer, plans }
}

export async function updateSiteSettings(data: {
  brandName?: string
  tagline?: string
  location?: string
  whatsapp?: string
  email?: string
  instagram?: string | null
  primaryColor?: string
  scheduleText?: string | null
}) {
  return prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: data,
    create: {
      id: 'default',
      ...data,
    },
  })
}

export async function updateTrainerProfile(
  userId: string,
  data: {
    firstName?: string
    lastName?: string
    headline?: string | null
    bio?: string | null
    philosophy?: string | null
    experienceYears?: number
    whatsapp?: string | null
    instagram?: string | null
  },
) {
  const profile = await prisma.trainerProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!profile) throw new AppError('Perfil de entrenador no encontrado', 404, 'NOT_FOUND')

  return prisma.trainerProfile.update({
    where: { userId },
    data,
  })
}

export async function updateServicePlan(
  id: string,
  data: {
    name?: string
    badge?: string | null
    description?: string | null
    priceArs?: number
    isActive?: boolean
  },
) {
  return prisma.servicePlan.update({
    where: { id },
    data,
  })
}

export async function getTrainerDashboardMetrics() {
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
    prisma.studentProfile.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.studentProfile.count({
      where: { joinedAt: { gte: monthStart, lte: monthEnd }, deletedAt: null },
    }),
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['CANCELLED'] },
      },
    }),
    prisma.payment.count({ where: { status: { in: ['PENDING', 'OVERDUE'] } } }),
    prisma.payment.aggregate({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { amountArs: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountArs: true },
    }),
    prisma.workoutSession.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.appointment.findMany({
      where: {
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
      where: { status: 'COMPLETED' },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 4,
    }),
    prisma.contactLead.findMany({
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
