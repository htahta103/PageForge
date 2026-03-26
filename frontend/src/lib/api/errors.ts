import type { ApiErrorBody } from '@/types/api'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, opts: { status: number; body: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status
    this.body = opts.body
  }
}

export function getApiErrorMessage(body: unknown): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as ApiErrorBody).message
    if (typeof m === 'string') return m
  }
  return 'Request failed'
}
