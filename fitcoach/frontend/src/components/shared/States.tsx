import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      className={cn('animate-pulse rounded-xl bg-elevated', className)}
    />
  )
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-muted">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}

export function ErrorState({
  title = 'No pudimos cargar la información',
  description = 'Verificá tu conexión e intentá nuevamente.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <Card className="flex flex-col items-center justify-center border-danger/30 p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {onRetry && (
        <Button className="mt-4" variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </Button>
      )}
    </Card>
  )
}
