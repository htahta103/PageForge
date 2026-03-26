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
