import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingSkeleton } from '@/components/shared/States'
import { apiRequest, setStoredToken } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  role: 'SUPER_ADMIN' | 'TRAINER' | 'STUDENT'
  fullName: string
  trainerId?: string
  trainerSlug?: string
  studentId?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  refreshUser: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const refreshUser = React.useCallback(async () => {
    try {
      const data = await apiRequest<{ user: AuthUser | null }>('/auth/me')
      if (!data.user) {
        setStoredToken(null)
      }
      setUser(data.user)
    } catch {
      setStoredToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const logout = React.useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => null)
    setStoredToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

export function RequireRole({
  role,
  children,
}: {
  role: 'TRAINER' | 'STUDENT'
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-8">
        <LoadingSkeleton className="h-12 w-64" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'TRAINER' ? '/trainer' : '/portal'} replace />
  }

  return <>{children}</>
}
