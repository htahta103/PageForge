import { getApiBaseUrl } from './config'
import { ApiError, getApiErrorMessage } from './errors'

function joinUrl(path: string): string {
  const base = getApiBaseUrl()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init
  const res = await fetch(joinUrl(path), {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  if (res.status === 204) return undefined as T

  const body = await parseBody(res)
  if (!res.ok) {
    throw new ApiError(getApiErrorMessage(body), {
      status: res.status,
      body,
    })
  }
  return body as T
}
