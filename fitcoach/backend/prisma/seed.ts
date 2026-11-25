import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient, PlanModality, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const trainerEmail =
    process.env.SEED_TRAINER_EMAIL ?? 'coach@fitcoach.com.ar'
  const trainerPassword =
    process.env.SEED_TRAINER_PASSWORD ?? 'ChangeMe123!'

  const passwordHash = await bcrypt.hash(trainerPassword, 12)

  await prisma.user.upsert({
    where: { email: trainerEmail },
    update: {},
    create: {
      email: trainerEmail,
      passwordHash,
      role: UserRole.TRAINER,
      isActive: true,
      trainerProfile: {
        create: {
          firstName: 'Martín',
          lastName: 'Álvarez',
          headline: 'Personal Trainer & Preparador Físico',
          experienceYears: 9,
          whatsapp: '5491155550199',
          instagram: '@fitcoach.ar',
          certifications: [
            'Profesor Nacional de Educación Física',
            'Especialista en Fuerza e Hipertrofia (ENADE)',
            'Certificación en Entrenamiento Funcional y Movilidad',
          ],
        },
      },
    },
  })

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      brandName: 'FITCOACH',
      tagline: 'Entrenamiento Personalizado',
      location: 'Buenos Aires, Argentina',
      whatsapp: '5491155550199',
      email: 'hola@fitcoach.com.ar',
      instagram: '@fitcoach.ar',
      primaryColor: '#B8F34B',
    },
  })

  const plans = [
    {
      slug: 'plan-online',
      name: 'Plan Online',
      priceArs: 42000,
      modality: PlanModality.ONLINE,
      sortOrder: 1,
      description:
        'Ideal si entrenás en tu gimnasio o en casa y buscás estructura profesional.',
      features: [
        'Rutina personalizada mensual en el Portal',
        'Registro de cargas, series y progreso',
        'Revisión técnica por video cada semana',
        'Soporte directo por WhatsApp',
      ],
    },
    {
      slug: 'plan-presencial',
      name: 'Plan Presencial',
      badge: 'Más elegido',
      priceArs: 85000,
      modality: PlanModality.IN_PERSON,
      sortOrder: 2,
      description:
        'Entrenamiento guiado cara a cara para maximizar técnica, seguridad y adherencia.',
      features: [
        '2 o 3 sesiones presenciales semanales',
        'Acceso completo al Portal del Alumno',
        'Evaluación física y mediciones mensuales',
        'Reprogramación flexible desde el calendario',
      ],
    },
    {
      slug: 'plan-premium',
      name: 'Plan Personalizado Premium',
      priceArs: 120000,
      modality: PlanModality.HYBRID,
      sortOrder: 3,
      description:
        'Acompañamiento integral híbrido con seguimiento diario y planificación avanzada.',
      features: [
        'Sesiones presenciales + días online complementarios',
        'Ajustes semanales de volumen e intensidad',
        'Seguimiento de composición corporal y cargas',
        'Prioridad de horarios y contacto 1 a 1',
      ],
    },
  ]

  for (const plan of plans) {
    await prisma.servicePlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    })
  }

  console.log('Seed FITCOACH completado correctamente.')
}

main()
  .catch((err) => {
    console.error('Error en seed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
