export interface Env {
  ORIGIN_URL: string
}

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? '*'
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers':
      req.headers.get('access-control-request-headers') ??
      'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'origin',
  }
}

function json(req: Request, data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(req),
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

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(req) })
    }

    if (url.pathname === '/health' || url.pathname === '/api/v1/health') {
      return json(req, { status: 'ok', service: 'pageforge-api-staging' })
    }

    if (!url.pathname.startsWith('/api/v1/')) {
      return json(req, { code: 'not_found', message: 'Not found' }, { status: 404 })
    }

    const origin = normalizeOrigin(env.ORIGIN_URL)
    if (!origin) {
      return json(
        req,
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

    const res = await fetch(upstream.toString(), {
      method: req.method,
      headers,
      body: req.body,
      redirect: 'manual',
    })

    const outHeaders = new Headers(res.headers)
    for (const [k, v] of Object.entries(corsHeaders(req))) outHeaders.set(k, v)
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: outHeaders,
    })
  },
}

