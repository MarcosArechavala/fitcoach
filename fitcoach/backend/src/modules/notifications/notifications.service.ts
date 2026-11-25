import { prisma } from '../../config/prisma.js'

export interface TrainerNotificationItem {
  id: string
  type: 'LEAD' | 'PAYMENT' | 'WORKOUT' | 'APPOINTMENT'
  severity: 'info' | 'warning' | 'urgent'
  title: string
  description: string
  createdAt: string
  href: string
}

export async function getTrainerNotifications(trainerId: string): Promise<{
  items: TrainerNotificationItem[]
  unreadCount: number
}> {
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const [newLeads, duePayments, recentSessions, todayAppointments] =
    await Promise.all([
      prisma.contactLead.findMany({
        where: { trainerId, status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.payment.findMany({
        where: {
          trainerId,
          status: { in: ['OVERDUE', 'PENDING'] },
          dueDate: { lte: threeDaysFromNow },
        },
        include: {
          student: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.workoutSession.findMany({
        where: {
          student: { trainerId },
          status: 'COMPLETED',
          completedAt: { gte: twoDaysAgo },
        },
        include: {
          student: { select: { firstName: true, lastName: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
      }),
      prisma.appointment.findMany({
        where: {
          trainerId,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          student: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
    ])

  const items: TrainerNotificationItem[] = []

  for (const lead of newLeads) {
    items.push({
      id: `lead-${lead.id}`,
      type: 'LEAD',
      severity: 'info',
      title: `Nueva consulta de ${lead.name}`,
      description: `Objetivo: ${lead.goal}`,
      createdAt: lead.createdAt.toISOString(),
      href: '/trainer/consultas',
    })
  }

  for (const payment of duePayments) {
    const isOverdue =
      payment.status === 'OVERDUE' || payment.dueDate.getTime() < startOfDay.getTime()
    const studentName = `${payment.student.firstName} ${payment.student.lastName}`
    items.push({
      id: `payment-${payment.id}`,
      type: 'PAYMENT',
      severity: isOverdue ? 'urgent' : 'warning',
      title: isOverdue
        ? `Pago vencido: ${studentName}`
        : `Pago próximo a vencer: ${studentName}`,
      description: `Importe: $${payment.amountArs.toLocaleString('es-AR')} ARS`,
      createdAt: payment.dueDate.toISOString(),
      href: '/trainer/pagos',
    })
  }

  for (const appt of todayAppointments) {
    const studentName = `${appt.student.firstName} ${appt.student.lastName}`
    const timeStr = appt.scheduledAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    })
    items.push({
      id: `appt-${appt.id}`,
      type: 'APPOINTMENT',
      severity: 'info',
      title: `Turno hoy ${timeStr} hs`,
      description: `${studentName} · ${appt.title}`,
      createdAt: appt.scheduledAt.toISOString(),
      href: '/trainer/calendario',
    })
  }

  for (const session of recentSessions) {
    const studentName = `${session.student.firstName} ${session.student.lastName}`
    items.push({
      id: `session-${session.id}`,
      type: 'WORKOUT',
      severity: 'info',
      title: `${studentName} completó su entrenamiento`,
      description: session.dayTitleSnap,
      createdAt: (session.completedAt ?? session.startedAt).toISOString(),
      href: '/trainer/alumnos',
    })
  }

  // Ordenar por fecha más reciente (priorizando urgentes arriba)
  items.sort((a, b) => {
    if (a.severity === 'urgent' && b.severity !== 'urgent') return -1
    if (b.severity === 'urgent' && a.severity !== 'urgent') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return {
    items,
    unreadCount: items.length,
  }
}

export async function getStudentNotifications(studentId: string): Promise<{
  items: TrainerNotificationItem[]
  unreadCount: number
}> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const fiveDaysAhead = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const [recentAssignments, upcomingAppointments, duePayments] =
    await Promise.all([
      prisma.workoutAssignment.findMany({
        where: {
          studentId,
          isActive: true,
          createdAt: { gte: sevenDaysAgo },
        },
        include: { template: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.appointment.findMany({
        where: {
          studentId,
          scheduledAt: { gte: startOfDay, lte: sevenDaysAhead },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
      }),
      prisma.payment.findMany({
        where: {
          studentId,
          status: { in: ['OVERDUE', 'PENDING'] },
          dueDate: { lte: fiveDaysAhead },
        },
        orderBy: { dueDate: 'asc' },
        take: 3,
      }),
    ])

  const items: TrainerNotificationItem[] = []

  for (const assignment of recentAssignments) {
    items.push({
      id: `assignment-${assignment.id}`,
      type: 'WORKOUT',
      severity: 'info',
      title: 'Nueva rutina asignada',
      description: assignment.template.name,
      createdAt: assignment.createdAt.toISOString(),
      href: '/portal/rutina',
    })
  }

  for (const appt of upcomingAppointments) {
    const dateStr = appt.scheduledAt.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Argentina/Buenos_Aires',
    })
    const timeStr = appt.scheduledAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    })
    items.push({
      id: `student-appt-${appt.id}`,
      type: 'APPOINTMENT',
      severity: 'info',
      title: `Próxima sesión: ${dateStr} ${timeStr} hs`,
      description: appt.title,
      createdAt: appt.scheduledAt.toISOString(),
      href: '/portal/sesiones',
    })
  }

  for (const payment of duePayments) {
    const isOverdue =
      payment.status === 'OVERDUE' || payment.dueDate.getTime() < startOfDay.getTime()
    items.push({
      id: `student-payment-${payment.id}`,
      type: 'PAYMENT',
      severity: isOverdue ? 'urgent' : 'warning',
      title: isOverdue ? 'Tenés una cuota vencida' : 'Cuota próxima a vencer',
      description: `Importe: $${payment.amountArs.toLocaleString('es-AR')} ARS`,
      createdAt: payment.dueDate.toISOString(),
      href: '/portal/perfil',
    })
  }

  items.sort((a, b) => {
    if (a.severity === 'urgent' && b.severity !== 'urgent') return -1
    if (b.severity === 'urgent' && a.severity !== 'urgent') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return {
    items,
    unreadCount: items.length,
  }
}
