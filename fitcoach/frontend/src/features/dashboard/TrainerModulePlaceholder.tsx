import { EmptyState } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'

export function TrainerModulePlaceholder({
  title,
  phase,
  description,
}: {
  title: string
  phase: string
  description: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold uppercase text-ink">{title}</h1>
        <Badge variant="subtle">{phase}</Badge>
      </div>
      <EmptyState
        title={`Módulo ${title} planificado para ${phase}`}
        description={description}
      />
    </div>
  )
}
