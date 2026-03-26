export function getApiBaseUrl(): string {
  const env =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API

  if (typeof env === 'string' && env.length > 0) {
    const trimmed = env.replace(/\/$/, '')
    if (trimmed.endsWith('/api/v1')) return trimmed
    return `${trimmed}/api/v1`
  }
  return '/api/v1'
}

export function getApiBearerToken(): string | null {
  const env = import.meta.env.VITE_API_BEARER_TOKEN
  if (typeof env === 'string' && env.trim().length > 0) return env.trim()
  return null
}
