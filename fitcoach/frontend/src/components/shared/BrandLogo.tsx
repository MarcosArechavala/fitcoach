import { BRAND_CONFIG } from '@/lib/brand.config'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  compact?: boolean
  brandName?: string
  tagline?: string
  className?: string
}

export function BrandLogo({
  compact = false,
  brandName,
  tagline,
  className,
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 7v10" />
          <path d="M18 7v10" />
          <path d="M3 9v6" />
          <path d="M21 9v6" />
          <path d="M6 12h12" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-extrabold tracking-wide text-ink">
            {brandName ?? BRAND_CONFIG.brandName}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {tagline ?? 'Personal Training'}
          </span>
        </span>
      )}
    </span>
  )
}
