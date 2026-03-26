import { getAuthToken, setAuthToken } from '../auth/token'
import { getApiBaseUrl } from './config'
import { ApiError } from './errors'

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

function joinUrl(base: string, path: string) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch<T = Json>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init
  const token = getAuthToken()

  const res = await fetch(joinUrl(getApiBaseUrl(), path), {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  if (res.status === 401) {
    setAuthToken(null)
  }

  if (!res.ok) {
    const body = await parseJsonSafe(res)
    throw new ApiError(`API request failed (${res.status})`, {
      status: res.status,
      body,
    })
  }

  return (await parseJsonSafe(res)) as T
}

