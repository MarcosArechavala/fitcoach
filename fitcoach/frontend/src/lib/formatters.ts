export const AR_TIMEZONE = 'America/Argentina/Buenos_Aires'

export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateAR(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

export function buildWhatsAppUrl(phoneDigits: string, message?: string): string {
  const clean = phoneDigits.replace(/\D/g, '')
  const base = `https://wa.me/${clean}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}
