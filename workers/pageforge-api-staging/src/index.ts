export interface Env {
  ORIGIN_URL: string
  DB: D1Database
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

function uuid(): string {
  return crypto.randomUUID()
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
      // Minimal D1-backed staging implementation to unblock UI/E2E.
      // Supports: GET/POST /api/v1/projects
      if (url.pathname === '/api/v1/projects' && req.method === 'GET') {
        await env.DB.exec(
          "CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, theme TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);",
        )
        const rows = await env.DB.prepare(
          'SELECT id, name, theme, created_at as createdAt, updated_at as updatedAt FROM projects ORDER BY updated_at DESC LIMIT 100',
        ).all()
        const data = (rows.results ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          pageCount: 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }))
        return json(req, { data, total: data.length })
      }

      if (url.pathname === '/api/v1/projects' && req.method === 'POST') {
        await env.DB.exec(
          "CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, theme TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);",
        )
        const body = await req.json().catch(() => null) as any
        const name = typeof body?.name === 'string' ? body.name.trim() : ''
        if (!name) {
          return json(req, { code: 'validation_error', message: 'name is required' }, { status: 400 })
        }
        const now = new Date().toISOString()
        const id = uuid()
        const theme =
          typeof body?.theme === 'object' && body?.theme
            ? JSON.stringify(body.theme)
            : JSON.stringify({
                colors: {
                  primary: '#3B82F6',
                  secondary: '#8B5CF6',
                  accent: '#F59E0B',
                  'neutral-50': '#FAFAFA',
                  'neutral-900': '#171717',
                },
                fonts: { heading: 'Inter', body: 'Inter' },
                spacing: 4,
              })

        await env.DB.prepare(
          'INSERT INTO projects (id, name, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        )
          .bind(id, name, theme, now, now)
          .run()

        return json(req, { id, name, theme: JSON.parse(theme), createdAt: now, updatedAt: now }, { status: 201 })
      }

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

