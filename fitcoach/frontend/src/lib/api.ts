const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

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
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.error?.message ?? 'Ocurrió un error al comunicarse con el servidor'
    const code = data?.error?.code ?? 'API_ERROR'
    throw new ApiError(message, response.status, code)
  }

  return data as T
}
