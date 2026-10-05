import { env } from '@/config/env'
import type { ApiResponse } from '@/types'

export class ApiError extends Error {
  code: string
  status?: number

  constructor(message: string, code = 'API_ERROR', status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export interface RequestOptions {
  timeoutMs?: number
  signal?: AbortSignal
}

let requestCounter = 0

/**
 * Low-level transport for the Google Apps Script Web App.
 *
 * Uses `text/plain` content type on purpose: Apps Script web apps do not
 * answer CORS pre-flight requests, and text/plain is a "simple" content type,
 * so the browser sends the POST directly without an OPTIONS pre-flight.
 */
export async function apiRequest<T>(
  action: string,
  payload: Record<string, unknown> = {},
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  if (!env.isApiConfigured) {
    throw new ApiError(
      'API URL is not configured. Set VITE_API_URL in your environment.',
      'NOT_CONFIGURED',
    )
  }

  const timeoutMs = options.timeoutMs ?? 20000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const requestId = `${Date.now()}-${++requestCounter}`

  try {
    const response = await fetch(env.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        requestId,
        apiKey: env.apiKey || undefined,
        ...payload,
      }),
      signal: controller.signal,
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}`,
        'HTTP_ERROR',
        response.status,
      )
    }

    const text = await response.text()
    let parsed: ApiResponse<T>
    try {
      parsed = JSON.parse(text) as ApiResponse<T>
    } catch {
      throw new ApiError(
        'Received an invalid response from the server.',
        'INVALID_RESPONSE',
      )
    }

    if (parsed.success === false) {
      throw new ApiError(
        parsed.message || parsed.error || 'Request failed',
        parsed.error || 'API_ERROR',
      )
    }

    return parsed
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 'TIMEOUT')
    }
    throw new ApiError(
      'Unable to reach the server. Check your network connection.',
      'NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred.'
}
