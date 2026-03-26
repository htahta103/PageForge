import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createProject, listProjects, type ProjectSummary } from '../lib/api/projectsPages'
import { paths } from '../routes/paths'

export function HomePage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await listProjects({ limit: 50 })
        if (!cancelled) setProjects(res.data)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not reach API')
          setProjects([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <p className="text-sm text-[color:var(--color-muted)]">
        Open the local sandbox editor or pick a saved project to edit pages backed by the API.
      </p>

      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium">Projects</div>
          <button
            type="button"
            disabled={busy}
            className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
            onClick={() => {
              const name = window.prompt('Project name', 'My project')
              if (name === null || name.trim() === '') return
              void (async () => {
                setBusy(true)
                setError(null)
                try {
                  await createProject({ name: name.trim() })
                  const res = await listProjects({ limit: 50 })
                  setProjects(res.data)
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Create failed')
                } finally {
                  setBusy(false)
                }
              })()
            }}
          >
            New project
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {projects === null ? (
          <p className="mt-3 text-sm text-[color:var(--color-muted)]">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--color-muted)]">
            No projects yet. Create one or use the sandbox at{' '}
            <Link className="text-[color:var(--color-primary)] underline" to={paths.editor}>
              Editor
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--color-border)] rounded-md border border-[color:var(--color-border)]">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-[color:var(--color-muted)]">
                    {p.pageCount} page{p.pageCount === 1 ? '' : 's'}
                  </div>
                </div>
                <Link
                  className="shrink-0 rounded-md bg-[color:var(--color-primary)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-primary-foreground)]"
                  to={paths.projectEditorBase(p.id)}
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
