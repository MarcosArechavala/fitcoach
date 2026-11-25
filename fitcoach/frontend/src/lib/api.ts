const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export const AUTH_TOKEN_KEY = 'fitcoach_session_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  } catch {}
}

export class ApiError extends Error {
  public readonly status: number
  public readonly code: string

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken()
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      setStoredToken(null)
    }
    const message =
      data?.error?.message ?? 'Ocurrió un error al comunicarse con el servidor'
    const code = data?.error?.code ?? 'API_ERROR'
    throw new ApiError(message, response.status, code)
  }

  return data as T
}
