export function getApiBaseUrl(): string {
  const env = import.meta.env.VITE_API_BASE_URL
  if (typeof env === 'string' && env.length > 0) return env.replace(/\/$/, '')
  return '/api/v1'
}
