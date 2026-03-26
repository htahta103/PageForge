export interface Env {
  ORIGIN_URL: string
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  })
}

function normalizeOrigin(originUrl: string): string {
  const trimmed = (originUrl ?? '').trim()
  if (!trimmed) return ''
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)

    if (url.pathname === '/health' || url.pathname === '/api/v1/health') {
      return json({ status: 'ok', service: 'pageforge-api-staging' })
    }

    if (!url.pathname.startsWith('/api/v1/')) {
      return json({ code: 'not_found', message: 'Not found' }, { status: 404 })
    }

    const origin = normalizeOrigin(env.ORIGIN_URL)
    if (!origin) {
      return json(
        {
          code: 'not_configured',
          message:
            'ORIGIN_URL is not set. Configure the upstream Go API and redeploy.',
        },
        { status: 501 },
      )
    }

    const upstream = new URL(origin)
    upstream.pathname = url.pathname
    upstream.search = url.search

    const headers = new Headers(req.headers)
    headers.delete('host')
    headers.set('x-forwarded-host', url.host)
    headers.set('x-forwarded-proto', url.protocol.replace(':', ''))

    return fetch(upstream.toString(), {
      method: req.method,
      headers,
      body: req.body,
      redirect: 'manual',
    })
  },
}

