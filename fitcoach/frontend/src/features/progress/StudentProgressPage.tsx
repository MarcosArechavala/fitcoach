import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Flame, Plus, Scale, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest, ApiError } from '@/lib/api'
import { formatDateAR } from '@/lib/formatters'

interface ProgressSummaryResponse {
  weeklyCompleted: number
  totalCompleted: number
  recentSessions: {
    id: string
    dayTitleSnap: string
    startedAt: string
    completedAt: string | null
    status: 'COMPLETED' | 'SKIPPED'
    studentNotes: string | null
    setsCount: number
  }[]
  measurements: {
    id: string
    recordedAt: string
    weightKg: number | null
    waistCm: number | null
    notes: string | null
  }[]
  loadProgression: {
    date: string
    maxWeightKg: number
    volume: number
  }[]
}

export function StudentProgressPage() {
  const queryClient = useQueryClient()
  const [weightInput, setWeightInput] = React.useState('')
  const [waistInput, setWaistInput] = React.useState('')

  const progressQuery = useQuery({
    queryKey: ['my-progress'],
    queryFn: () => apiRequest<ProgressSummaryResponse>('/progress/me'),
  })

  const measurementMutation = useMutation({
    mutationFn: () =>
      apiRequest('/progress/measurements', {
        method: 'POST',
        body: JSON.stringify({
          weightKg: weightInput ? Number(weightInput) : null,
          waistCm: waistInput ? Number(waistInput) : null,
        }),
      }),
    onSuccess: () => {
      toast.success('Medición registrada')
      setWeightInput('')
      setWaistInput('')
      void queryClient.invalidateQueries({ queryKey: ['my-progress'] })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Error al guardar'),
  })

  if (progressQuery.isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-56 w-full" />
      </div>
    )
  }

  if (progressQuery.isError) {
    return <ErrorState onRetry={() => void progressQuery.refetch()} />
  }

  const data = progressQuery.data!
  const latestWeight =
    data.measurements.filter((m) => m.weightKg !== null).at(-1)?.weightKg ?? null

  const weightChartData = data.measurements
    .filter((m) => m.weightKg !== null)
    .map((m) => ({
      fecha: formatDateAR(m.recordedAt),
      peso: m.weightKg,
    }))

  const loadChartData = data.loadProgression.map((l) => ({
    fecha: formatDateAR(l.date),
    cargaMax: l.maxWeightKg,
  }))

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold uppercase text-ink">
        Mi Progreso
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-3.5 text-center">
          <Flame className="mx-auto h-4 w-4 text-brand-text" aria-hidden="true" />
          <p className="mt-1 font-display text-2xl font-extrabold text-ink tabular-nums">
            {data.weeklyCompleted}
          </p>
          <p className="text-[11px] text-muted">Esta semana</p>
        </Card>
        <Card className="p-3.5 text-center">
          <CheckCircle2 className="mx-auto h-4 w-4 text-success" aria-hidden="true" />
          <p className="mt-1 font-display text-2xl font-extrabold text-ink tabular-nums">
            {data.totalCompleted}
          </p>
          <p className="text-[11px] text-muted">Completadas</p>
        </Card>
        <Card className="p-3.5 text-center">
          <Scale className="mx-auto h-4 w-4 text-brand-text" aria-hidden="true" />
          <p className="mt-1 font-display text-2xl font-extrabold text-ink tabular-nums">
            {latestWeight ? `${latestWeight} kg` : '—'}
          </p>
          <p className="text-[11px] text-muted">Peso actual</p>
        </Card>
      </div>

      {/* Registrar medición */}
      <Card className="p-4">
        <h2 className="font-display text-lg font-bold uppercase text-ink">
          Registrar peso corporal
        </h2>
        <div className="mt-3 grid grid-cols-12 items-end gap-2">
          <div className="col-span-5 space-y-1">
            <Label htmlFor="m-weight" className="text-xs">
              Peso (kg)
            </Label>
            <Input
              id="m-weight"
              type="number"
              step="0.1"
              placeholder="72.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
          </div>
          <div className="col-span-4 space-y-1">
            <Label htmlFor="m-waist" className="text-xs">
              Cintura (cm)
            </Label>
            <Input
              id="m-waist"
              type="number"
              step="0.5"
              placeholder="Opcional"
              value={waistInput}
              onChange={(e) => setWaistInput(e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <Button
              className="w-full"
              disabled={(!weightInput && !waistInput) || measurementMutation.isPending}
              onClick={() => measurementMutation.mutate()}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Gráfico Peso Corporal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg uppercase">
            <Scale className="h-4 w-4 text-brand-text" aria-hidden="true" />
            Evolución de peso (kg)
          </CardTitle>
          <CardDescription>Tus últimos registros corporales</CardDescription>
        </CardHeader>
        <CardContent>
          {weightChartData.length < 2 ? (
            <p className="text-xs text-muted">
              Registrá al menos 2 mediciones de peso para visualizar el gráfico de tendencia.
            </p>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27313D" opacity={0.4} />
                  <XAxis dataKey="fecha" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151B23',
                      borderColor: '#27313D',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="peso"
                    stroke="#B8F34B"
                    fill="#B8F34B"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico Evolución de Cargas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg uppercase">
            <TrendingUp className="h-4 w-4 text-brand-text" aria-hidden="true" />
            Carga máxima por sesión (kg)
          </CardTitle>
          <CardDescription>Progresión de fuerza registrada</CardDescription>
        </CardHeader>
        <CardContent>
          {!loadChartData.length ? (
            <p className="text-xs text-muted">
              Completá sesiones con pesos registrados para ver tu evolución de cargas.
            </p>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loadChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27313D" opacity={0.4} />
                  <XAxis dataKey="fecha" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151B23',
                      borderColor: '#27313D',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Bar dataKey="cargaMax" fill="#B8F34B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de sesiones */}
      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold uppercase text-ink">
          Historial de entrenamientos
        </h2>
        {!data.recentSessions.length ? (
          <EmptyState
            title="Aún no completaste sesiones"
            description="Iniciá tu entrenamiento del día desde Inicio o Mi Rutina."
          />
        ) : (
          data.recentSessions.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{s.dayTitleSnap}</p>
                  <p className="text-xs text-muted">
                    {formatDateAR(s.completedAt ?? s.startedAt)} · {s.setsCount} series
                    registradas
                  </p>
                  {s.studentNotes && (
                    <p className="mt-1 text-xs italic text-muted">“{s.studentNotes}”</p>
                  )}
                </div>
                <Badge variant={s.status === 'COMPLETED' ? 'success' : 'warning'}>
                  {s.status === 'COMPLETED' ? 'Completada' : 'Omitida'}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
