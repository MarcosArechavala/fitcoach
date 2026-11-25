export interface ServiceItem {
  id: string
  title: string
  description: string
  iconName: 'dumbbell' | 'laptop' | 'flame' | 'activity' | 'clipboard'
}

export interface PlanItem {
  id: string
  name: string
  badge?: string
  priceARS: number
  periodLabel: string
  description: string
  features: string[]
  highlighted?: boolean
}

export interface TestimonialItem {
  id: string
  name: string
  goal: string
  quote: string
  resultBadge: string
  isDemo: boolean
}

export const BRAND_CONFIG = {
  brandName: 'FITCOACH',
  tagline: 'Entrenamiento Personalizado',
  location: 'Buenos Aires, Argentina',
  whatsappNumber: '5491155550199',
  whatsappDisplay: '+54 9 11 5555-0199',
  email: 'hola@fitcoach.com.ar',
  instagram: '@fitcoach.ar',
  trainer: {
    fullName: 'Martín Álvarez',
    role: 'Personal Trainer & Preparador Físico',
    experienceYears: 9,
    bio: 'Acompaño a personas con agendas reales a construir fuerza, mejorar su composición corporal y sostener hábitos de entrenamiento sin improvisación. Cada planificación combina ciencia del ejercicio, técnica cuidada y seguimiento semanal.',
    philosophy:
      'No creo en rutinas genéricas ni en soluciones mágicas. Creo en la progresión medible, la constancia inteligente y un acompañamiento cercano que se adapte a tu vida.',
    certifications: [
      'Profesor Nacional de Educación Física',
      'Especialista en Fuerza e Hipertrofia (ENADE)',
      'Certificación en Entrenamiento Funcional y Movilidad',
    ],
  },
  services: [
    {
      id: 'presencial',
      title: 'Entrenamiento presencial',
      description:
        'Sesiones 1 a 1 en estudio privado con corrección técnica en tiempo real y ajuste de cargas.',
      iconName: 'dumbbell',
    },
    {
      id: 'online',
      title: 'Entrenamiento online',
      description:
        'Tu rutina estructurada en tu portal personal con videos, progresiones y feedback semanal.',
      iconName: 'laptop',
    },
    {
      id: 'fuerza',
      title: 'Fuerza e hipertrofia',
      description:
        'Programación basada en sobrecarga progresiva, control de RPE/RIR y técnica eficiente.',
      iconName: 'flame',
    },
    {
      id: 'acondicionamiento',
      title: 'Acondicionamiento físico',
      description:
        'Mejora de capacidad aeróbica, potencia y resistencia metabólica según tu punto de partida.',
      iconName: 'activity',
    },
    {
      id: 'planificacion',
      title: 'Planificación personalizada',
      description:
        'Bloques mensuales diseñados según tus objetivos, disponibilidad horaria y equipamiento.',
      iconName: 'clipboard',
    },
  ] satisfies ServiceItem[],
  plans: [
    {
      id: 'plan-online',
      name: 'Plan Online',
      priceARS: 42000,
      periodLabel: '/ mes',
      description: 'Ideal si entrenás en tu gimnasio o en casa y buscás estructura profesional.',
      features: [
        'Rutina personalizada mensual en el Portal',
        'Registro de cargas, series y progreso',
        'Revisión técnica por video cada semana',
        'Soporte directo por WhatsApp',
      ],
    },
    {
      id: 'plan-presencial',
      name: 'Plan Presencial',
      badge: 'Más elegido',
      priceARS: 85000,
      periodLabel: '/ mes',
      description: 'Entrenamiento guiado cara a cara para maximizar técnica, seguridad y adherencia.',
      highlighted: true,
      features: [
        '2 o 3 sesiones presenciales semanales',
        'Acceso completo al Portal del Alumno',
        'Evaluación física y mediciones mensuales',
        'Reprogramación flexible desde el calendario',
      ],
    },
    {
      id: 'plan-premium',
      name: 'Plan Personalizado Premium',
      priceARS: 120000,
      periodLabel: '/ mes',
      description: 'Acompañamiento integral híbrido con seguimiento diario y planificación avanzada.',
      features: [
        'Sesiones presenciales + días online complementarios',
        'Ajustes semanales de volumen e intensidad',
        'Seguimiento de composición corporal y cargas',
        'Prioridad de horarios y contacto 1 a 1',
      ],
    },
  ] satisfies PlanItem[],
  testimonials: [
    {
      id: 'demo-1',
      name: 'Lucía Fernández',
      goal: 'Fuerza y composición corporal',
      quote:
        'Pasé de entrenar sin rumbo a seguir un plan claro desde el celular. En 4 meses mejoré mis marcas en sentadilla y bajé la fatiga diaria.',
      resultBadge: '+22 kg en sentadilla',
      isDemo: true,
    },
    {
      id: 'demo-2',
      name: 'Santiago Morales',
      goal: 'Hipertrofia · Plan Online',
      quote:
        'Tener cada serie y peso sugerido en el portal hace que entrene en 50 minutos sin perder tiempo. El seguimiento semanal marca la diferencia.',
      resultBadge: '16 semanas constantes',
      isDemo: true,
    },
    {
      id: 'demo-3',
      name: 'Camila Rossi',
      goal: 'Acondicionamiento físico',
      quote:
        'Empecé de cero y con molestias de espalda. Ajustamos cada ejercicio desde el día uno y hoy entreno tres veces por semana sin dolor.',
      resultBadge: 'Adherencia del 94%',
      isDemo: true,
    },
  ] satisfies TestimonialItem[],
} as const
