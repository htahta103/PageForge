import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PageSummary } from '../lib/api/projectsPages'
import {
  createPage,
  deletePage,
  duplicatePage,
  updatePage,
} from '../lib/api/projectsPages'
import { paths } from '../routes/paths'
import { slugifyPageName } from '../utils/componentTreePersistence'

export function PageSidebar({
  projectId,
  pages,
  activePageId,
  onBeforeNavigate,
  onPagesChanged,
  disabled,
}: {
  projectId: string
  pages: PageSummary[]
  activePageId: string
  onBeforeNavigate?: () => Promise<void>
  onPagesChanged: () => Promise<void> | void
  disabled?: boolean
}) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(op: () => Promise<void>) {
    setError(null)
    setBusy(true)
    try {
      await op()
      await onPagesChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Pages</div>
        <button
          type="button"
          disabled={disabled || busy}
          className="rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
          onClick={() => {
            const name = window.prompt('New page name', 'Untitled')
            if (name === null || name.trim() === '') return
            void run(async () => {
              await onBeforeNavigate?.()
              const page = await createPage(projectId, { name: name.trim() })
              navigate(paths.projectEditor(projectId, page.id))
            })
          }}
        >
          New page
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
        {pages.map((p) => {
          const active = p.id === activePageId
          return (
            <li
              key={p.id}
              className={[
                'flex items-center gap-1 rounded-md border border-transparent',
                active ? 'bg-black/5 ring-1 ring-[color:var(--color-border)]' : '',
              ].join(' ')}
            >
              <button
                type="button"
                disabled={disabled || busy}
                className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm hover:bg-black/5 disabled:opacity-50"
                onClick={() => {
                  void (async () => {
                    await onBeforeNavigate?.()
                    navigate(paths.projectEditor(projectId, p.id))
                  })()
                }}
              >
                <span className="font-medium">{p.name}</span>
                <span className="ml-1 text-xs text-[color:var(--color-muted)]">({p.componentCount})</span>
              </button>
              <div className="flex shrink-0 gap-0.5 pr-1">
                <button
                  type="button"
                  title="Rename"
                  disabled={disabled || busy}
                  className="rounded px-1.5 py-0.5 text-xs text-[color:var(--color-muted)] hover:bg-black/5 hover:text-[color:var(--color-fg)] disabled:opacity-50"
                  onClick={() => {
                    const next = window.prompt('Page name', p.name)
                    if (next === null || next.trim() === '' || next.trim() === p.name) return
                    const trimmed = next.trim()
                    void run(async () => {
                      const base = slugifyPageName(trimmed)
                      const slug = base.length > 0 ? `${base}-${p.id.slice(0, 8)}` : `page-${p.id.slice(0, 8)}`
                      await updatePage(projectId, p.id, { name: trimmed, slug })
                    })
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  title="Duplicate"
                  disabled={disabled || busy}
                  className="rounded px-1.5 py-0.5 text-xs text-[color:var(--color-muted)] hover:bg-black/5 hover:text-[color:var(--color-fg)] disabled:opacity-50"
                  onClick={() => {
                    void run(async () => {
                      await onBeforeNavigate?.()
                      const copy = await duplicatePage(projectId, p.id)
                      navigate(paths.projectEditor(projectId, copy.id))
                    })
                  }}
                >
                  ⧉
                </button>
                <button
                  type="button"
                  title="Delete"
                  disabled={disabled || busy || pages.length <= 1}
                  className="rounded px-1.5 py-0.5 text-xs text-red-600/80 hover:bg-red-50 disabled:opacity-40"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Delete page "${p.name}"? This cannot be undone.`,
                      )
                    ) {
                      return
                    }
                    void run(async () => {
                      const wasActive = p.id === activePageId
                      await deletePage(projectId, p.id)
                      const remaining = pages.filter((x) => x.id !== p.id)
                      if (wasActive && remaining.length > 0) {
                        navigate(paths.projectEditor(projectId, remaining[0].id))
                      }
                    })
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {pages.length <= 1 ? (
        <p className="mt-2 text-xs text-[color:var(--color-muted)]">
          A project needs at least one page.
        </p>
      ) : null}
    </div>
  )
}
