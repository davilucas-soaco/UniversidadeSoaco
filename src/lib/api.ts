export const UNAUTHORIZED_EVENT = 'soaco:unauthorized'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

/** Chamada à API do backend (mesma origem; em dev o Vite faz proxy de /api). */
export async function api<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const offlineMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
  let response: Response
  try {
    const isForm = body instanceof FormData
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body === undefined || isForm ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, offlineMessage)
  }

  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    const fallback = response.status >= 502 && response.status <= 504 ? offlineMessage : 'Erro ao comunicar com o servidor.'
    throw new ApiError(response.status, payload?.error ?? fallback)
  }

  return payload as T
}
