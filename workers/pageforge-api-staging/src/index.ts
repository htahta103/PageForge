import {
  exportPageFromComponents,
  exportPageZipFromComponents,
  ExportValidationError,
} from './pageExport'

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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
      // Supports: Projects list/create + Pages list/create/get/update
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

      const projectGetMatch = url.pathname.match(/^\/api\/v1\/projects\/([^/]+)$/)
      if (projectGetMatch && req.method === 'GET') {
        await env.DB.exec(
          "CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, theme TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);",
        )
        const projectId = projectGetMatch[1]
        const row = await env.DB.prepare(
          'SELECT id, name, theme, created_at as createdAt, updated_at as updatedAt FROM projects WHERE id = ? LIMIT 1',
        )
          .bind(projectId)
          .first()
        if (!row) return json(req, { code: 'not_found', message: 'Project not found' }, { status: 404 })
        const theme = (() => {
          try {
            return JSON.parse((row as any).theme ?? '{}')
          } catch {
            return {}
          }
        })()
        return json(req, { ...(row as any), theme })
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

      // Pages tables
      await env.DB.exec(
        "CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL, components TEXT NOT NULL, sort_order INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(project_id, slug));",
      )

      const pagesListMatch = url.pathname.match(/^\/api\/v1\/projects\/([^/]+)\/pages$/)
      if (pagesListMatch && req.method === 'GET') {
        const projectId = pagesListMatch[1]
        const rows = await env.DB.prepare(
          'SELECT id, project_id as projectId, name, slug, sort_order as "order", created_at as createdAt, updated_at as updatedAt FROM pages WHERE project_id = ? ORDER BY sort_order ASC, updated_at DESC LIMIT 200',
        )
          .bind(projectId)
          .all()
        const data = (rows.results ?? []).map((r: any) => ({
          id: r.id,
          projectId: r.projectId,
          name: r.name,
          slug: r.slug,
          order: r.order ?? 0,
          componentCount: 0,
        }))
        return json(req, { data })
      }

      if (pagesListMatch && req.method === 'POST') {
        const projectId = pagesListMatch[1]
        const body = (await req.json().catch(() => null)) as any
        const name = typeof body?.name === 'string' ? body.name.trim() : ''
        if (!name) {
          return json(req, { code: 'validation_error', message: 'name is required' }, { status: 400 })
        }
        const slug = typeof body?.slug === 'string' && body.slug.trim() ? body.slug.trim() : slugify(name)
        const now = new Date().toISOString()
        const id = uuid()
        const components = '[]'
        const sortOrder = 0
        try {
          await env.DB.prepare(
            'INSERT INTO pages (id, project_id, name, slug, components, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          )
            .bind(id, projectId, name, slug, components, sortOrder, now, now)
            .run()
        } catch {
          return json(req, { code: 'validation_error', message: 'slug already exists' }, { status: 400 })
        }
        return json(
          req,
          { id, projectId, name, slug, components: [], order: sortOrder, createdAt: now, updatedAt: now },
          { status: 201 },
        )
      }

      const pageGetMatch = url.pathname.match(/^\/api\/v1\/projects\/([^/]+)\/pages\/([^/]+)$/)
      if (pageGetMatch && req.method === 'GET') {
        const projectId = pageGetMatch[1]
        const pageId = pageGetMatch[2]
        const row = await env.DB.prepare(
          'SELECT id, project_id as projectId, name, slug, components, sort_order as "order", created_at as createdAt, updated_at as updatedAt FROM pages WHERE project_id = ? AND id = ? LIMIT 1',
        )
          .bind(projectId, pageId)
          .first()
        if (!row) return json(req, { code: 'not_found', message: 'Page not found' }, { status: 404 })
        const components = (() => {
          try {
            return JSON.parse((row as any).components ?? '[]')
          } catch {
            return []
          }
        })()
        return json(req, { ...(row as any), components })
      }

      if (pageGetMatch && req.method === 'PUT') {
        const projectId = pageGetMatch[1]
        const pageId = pageGetMatch[2]
        const body = (await req.json().catch(() => null)) as any
        const now = new Date().toISOString()
        const current = await env.DB.prepare(
          'SELECT id, project_id as projectId, name, slug, components, sort_order as "order", created_at as createdAt, updated_at as updatedAt FROM pages WHERE project_id = ? AND id = ? LIMIT 1',
        )
          .bind(projectId, pageId)
          .first()
        if (!current) return json(req, { code: 'not_found', message: 'Page not found' }, { status: 404 })

        const name = typeof body?.name === 'string' ? body.name.trim() : (current as any).name
        const slug = typeof body?.slug === 'string' ? body.slug.trim() : (current as any).slug
        const order = typeof body?.order === 'number' ? body.order : (current as any).order
        const components =
          Array.isArray(body?.components) ? JSON.stringify(body.components) : (current as any).components

        await env.DB.prepare(
          'UPDATE pages SET name = ?, slug = ?, components = ?, sort_order = ?, updated_at = ? WHERE project_id = ? AND id = ?',
        )
          .bind(name, slug, components, order, now, projectId, pageId)
          .run()

        return json(req, {
          id: pageId,
          projectId,
          name,
          slug,
          components: (() => {
            try {
              return JSON.parse(components ?? '[]')
            } catch {
              return []
            }
          })(),
          order,
          createdAt: (current as any).createdAt,
          updatedAt: now,
        })
      }

      const pageExportMatch = url.pathname.match(
        /^\/api\/v1\/projects\/([^/]+)\/pages\/([^/]+)\/export$/,
      )
      if (pageExportMatch && req.method === 'GET') {
        const projectId = pageExportMatch[1]
        const pageId = pageExportMatch[2]
        const formatRaw = url.searchParams.get('format')
        if (!formatRaw) {
          return json(req, { code: 'validation_error', message: 'format is required' }, { status: 400 })
        }
        if (formatRaw !== 'html' && formatRaw !== 'react') {
          return json(
            req,
            { code: 'validation_error', message: 'format must be one of: html, react' },
            { status: 400 },
          )
        }
        const row = await env.DB.prepare(
          'SELECT components FROM pages WHERE project_id = ? AND id = ? LIMIT 1',
        )
          .bind(projectId, pageId)
          .first()
        if (!row) {
          return json(req, { code: 'not_found', message: 'Page not found' }, { status: 404 })
        }
        let components: unknown
        try {
          components = JSON.parse((row as any).components ?? '[]')
        } catch {
          return json(
            req,
            { code: 'validation_error', message: 'invalid components JSON' },
            { status: 400 },
          )
        }
        try {
          const result = exportPageFromComponents(components, formatRaw)
          return json(req, result)
        } catch (e) {
          if (e instanceof ExportValidationError) {
            return json(req, { code: 'validation_error', message: e.message }, { status: 400 })
          }
          throw e
        }
      }

      const pageExportZipMatch = url.pathname.match(
        /^\/api\/v1\/projects\/([^/]+)\/pages\/([^/]+)\/export\/zip$/,
      )
      if (pageExportZipMatch && req.method === 'GET') {
        const projectId = pageExportZipMatch[1]
        const pageId = pageExportZipMatch[2]
        const formatRaw = url.searchParams.get('format')
        if (!formatRaw) {
          return json(req, { code: 'validation_error', message: 'format is required' }, { status: 400 })
        }
        if (formatRaw !== 'html' && formatRaw !== 'react') {
          return json(
            req,
            { code: 'validation_error', message: 'format must be one of: html, react' },
            { status: 400 },
          )
        }
        const row = await env.DB.prepare(
          'SELECT components FROM pages WHERE project_id = ? AND id = ? LIMIT 1',
        )
          .bind(projectId, pageId)
          .first()
        if (!row) {
          return json(req, { code: 'not_found', message: 'Page not found' }, { status: 404 })
        }
        let components: unknown
        try {
          components = JSON.parse((row as any).components ?? '[]')
        } catch {
          return json(
            req,
            { code: 'validation_error', message: 'invalid components JSON' },
            { status: 400 },
          )
        }
        try {
          const zipBytes = exportPageZipFromComponents(components, formatRaw)
          return new Response(zipBytes, {
            status: 200,
            headers: {
              'content-type': 'application/zip',
              'content-disposition': 'attachment; filename=pageforge-export.zip',
              ...corsHeaders(req),
            },
          })
        } catch (e) {
          if (e instanceof ExportValidationError) {
            return json(req, { code: 'validation_error', message: e.message }, { status: 400 })
          }
          throw e
        }
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

