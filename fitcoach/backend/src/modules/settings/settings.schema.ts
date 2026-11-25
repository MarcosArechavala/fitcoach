import { z } from 'zod'

const serviceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(2),
  iconName: z.enum(['dumbbell', 'laptop', 'flame', 'activity', 'clipboard']),
})

const testimonialItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  goal: z.string().min(2),
  quote: z.string().min(5),
  resultBadge: z.string().min(1),
})

export const updateSiteSettingsSchema = z.object({
  brandName: z.string().min(2).optional(),
  tagline: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  whatsapp: z.string().min(6).optional(),
  email: z.string().email().optional(),
  instagram: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  scheduleText: z.string().optional().nullable(),
  heroImageUrl: z.string().optional().nullable(),
  heroTitle: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  services: z.array(serviceItemSchema).optional(),
  testimonials: z.array(testimonialItemSchema).optional(),
})

export const updateTrainerProfileSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones')
    .optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  headline: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  philosophy: z.string().optional().nullable(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  whatsapp: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  certifications: z.array(z.string().min(1)).optional(),
})

export const createPlanSchema = z.object({
  name: z.string().min(2),
  badge: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  priceArs: z.coerce.number().int().positive(),
  modality: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID']).default('ONLINE'),
  features: z.array(z.string().min(1)).default([]),
  isActive: z.boolean().default(true),
})

export const updatePlanSchema = z.object({
  name: z.string().min(2).optional(),
  badge: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  priceArs: z.coerce.number().int().positive().optional(),
  modality: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID']).optional(),
  features: z.array(z.string().min(1)).optional(),
  isActive: z.boolean().optional(),
})

export const planIdParamSchema = z.object({
  id: z.string().min(1),
})
