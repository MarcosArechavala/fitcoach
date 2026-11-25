import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { StudentLayout } from '@/components/layout/StudentLayout'
import { TrainerLayout } from '@/components/layout/TrainerLayout'
import { LoadingSkeleton } from '@/components/shared/States'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { AuthProvider, RequireRole } from '@/features/auth/AuthContext'
import { LandingPage } from '@/features/landing/LandingPage'
import { PlatformLandingPage } from '@/features/landing/PlatformLandingPage'

const LoginPage = React.lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterTrainerPage = React.lazy(() =>
  import('@/features/auth/RegisterTrainerPage').then((m) => ({
    default: m.RegisterTrainerPage,
  })),
)
const AcceptInvitationPage = React.lazy(() =>
  import('@/features/auth/AcceptInvitationPage').then((m) => ({
    default: m.AcceptInvitationPage,
  })),
)
const ForgotPasswordPage = React.lazy(() =>
  import('@/features/auth/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
)
const TrainerDashboardPage = React.lazy(() =>
  import('@/features/dashboard/TrainerDashboardPage').then((m) => ({
    default: m.TrainerDashboardPage,
  })),
)
const StudentsPage = React.lazy(() =>
  import('@/features/students/StudentsPage').then((m) => ({
    default: m.StudentsPage,
  })),
)
const ExercisesPage = React.lazy(() =>
  import('@/features/exercises/ExercisesPage').then((m) => ({
    default: m.ExercisesPage,
  })),
)
const WorkoutBuilderPage = React.lazy(() =>
  import('@/features/workouts/WorkoutBuilderPage').then((m) => ({
    default: m.WorkoutBuilderPage,
  })),
)
const CalendarPage = React.lazy(() =>
  import('@/features/appointments/CalendarPage').then((m) => ({
    default: m.CalendarPage,
  })),
)
const PaymentsPage = React.lazy(() =>
  import('@/features/payments/PaymentsPage').then((m) => ({
    default: m.PaymentsPage,
  })),
)
const LeadsPage = React.lazy(() =>
  import('@/features/leads/LeadsPage').then((m) => ({ default: m.LeadsPage })),
)
const SettingsPage = React.lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  })),
)
const StudentHomePage = React.lazy(() =>
  import('@/features/student-portal/StudentHomePage').then((m) => ({
    default: m.StudentHomePage,
  })),
)
const StudentRoutinePage = React.lazy(() =>
  import('@/features/student-portal/StudentRoutinePage').then((m) => ({
    default: m.StudentRoutinePage,
  })),
)
const WorkoutLoggerPage = React.lazy(() =>
  import('@/features/student-portal/WorkoutLoggerPage').then((m) => ({
    default: m.WorkoutLoggerPage,
  })),
)
const StudentProgressPage = React.lazy(() =>
  import('@/features/progress/StudentProgressPage').then((m) => ({
    default: m.StudentProgressPage,
  })),
)
const StudentSessionsPage = React.lazy(() =>
  import('@/features/student-portal/StudentSessionsPage').then((m) => ({
    default: m.StudentSessionsPage,
  })),
)
const StudentProfilePage = React.lazy(() =>
  import('@/features/student-portal/StudentProfilePage').then((m) => ({
    default: m.StudentProfilePage,
  })),
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

function PageFallback() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <LoadingSkeleton className="h-10 w-56" />
      <LoadingSkeleton className="h-48 w-full" />
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <React.Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Landing pública SaaS, Auth y Landing única por entrenador */}
                <Route path="/" element={<PlatformLandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterTrainerPage />} />
                <Route path="/invitacion" element={<AcceptInvitationPage />} />
                <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
                <Route path="/:slug" element={<LandingPage />} />

                {/* Panel del Entrenador */}
                <Route
                  path="/trainer"
                  element={
                    <RequireRole role="TRAINER">
                      <TrainerLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<TrainerDashboardPage />} />
                  <Route path="alumnos" element={<StudentsPage />} />
                  <Route path="ejercicios" element={<ExercisesPage />} />
                  <Route path="rutinas" element={<WorkoutBuilderPage />} />
                  <Route path="calendario" element={<CalendarPage />} />
                  <Route path="pagos" element={<PaymentsPage />} />
                  <Route path="consultas" element={<LeadsPage />} />
                  <Route path="configuracion" element={<SettingsPage />} />
                </Route>

                {/* Portal del Alumno */}
                <Route
                  path="/portal"
                  element={
                    <RequireRole role="STUDENT">
                      <StudentLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<StudentHomePage />} />
                  <Route path="rutina" element={<StudentRoutinePage />} />
                  <Route path="entrenar" element={<WorkoutLoggerPage />} />
                  <Route path="progreso" element={<StudentProgressPage />} />
                  <Route path="sesiones" element={<StudentSessionsPage />} />
                  <Route path="perfil" element={<StudentProfilePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </React.Suspense>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
