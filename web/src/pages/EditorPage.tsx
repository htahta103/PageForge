import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { canvasRedo, canvasUndo, loadCanvasState, useAppStore } from '../store/useAppStore'
import { getDefinition } from '../registry/registry'
import { BreakpointToolbar } from '../editor/BreakpointToolbar'
import { LayerTree } from '../editor/LayerTree'
import { PageSidebar } from '../editor/PageSidebar'
import { Palette } from '../editor/Palette'
import { Canvas } from '../editor/Canvas'
import { CanvasViewportProvider } from '../editor/CanvasViewportContext'
import { CanvasZoomToolbar } from '../editor/CanvasZoomToolbar'
import { HistoryPanel } from '../editor/HistoryPanel'
import { Inspector } from '../editor/Inspector'
import { UndoRedoToolbar } from '../editor/UndoRedoToolbar'
import {
  buildExportedHtml,
  downloadExportZip,
  downloadTextFile,
  openExportedHtmlPreview,
} from '../utils/exportHtmlCss'
import { buildExportedReactTailwind } from '../utils/exportReactTailwind'
import { deserializeToComponentRecord } from '../utils/componentTreePersistence'
import {
  createPage,
  getPage,
  listPages,
  persistCanvasToPage,
  type PageSummary,
} from '../lib/api/projectsPages'
import { paths } from '../routes/paths'

type PaletteDragData = { kind: 'palette'; componentType: string }

function isPaletteDragData(value: unknown): value is PaletteDragData {
  if (!value || typeof value !== 'object') return false
  const v = value as { kind?: unknown; componentType?: unknown }
  return v.kind === 'palette' && typeof v.componentType === 'string'
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return Boolean(target.closest('input, textarea, select'))
}

export function EditorPage() {
  const { projectId, pageId } = useParams<{ projectId?: string; pageId?: string }>()
  const navigate = useNavigate()
  const projectMode = Boolean(projectId)

  const ensureInitialized = useAppStore((s) => s.ensureInitialized)
  const addComponentWithDefaults = useAppStore((s) => s.addComponentWithDefaults)
  const deleteComponents = useAppStore((s) => s.deleteComponents)
  const components = useAppStore((s) => s.components)
  const activeBreakpoint = useAppStore((s) => s.activeBreakpoint)

  const [pages, setPages] = useState<PageSummary[]>([])
  const [projectLoading, setProjectLoading] = useState(projectMode)
  const [projectError, setProjectError] = useState<string | null>(null)
  const hydratingRef = useRef(false)
  const projectIdRef = useRef<string | undefined>(projectId)
  const pageIdRef = useRef<string | undefined>(pageId)

  projectIdRef.current = projectId
  pageIdRef.current = pageId

  if (!projectMode) {
    ensureInitialized()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return
      const { selectedIds, deleteSelected, nudgeSelectedLayout } = useAppStore.getState()
      if (!selectedIds.length) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
        return
      }
      const step = e.shiftKey ? 8 : 2
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nudgeSelectedLayout(-step, 0)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nudgeSelectedLayout(step, 0)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        nudgeSelectedLayout(0, -step)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        nudgeSelectedLayout(0, step)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hasRoot = Boolean(components.root)
  const paletteCount = Object.keys(components).length - (hasRoot ? 1 : 0)

  const refreshPages = useCallback(async () => {
    if (!projectId) return
    const res = await listPages(projectId)
    setPages(res.data)
  }, [projectId])

  const flushSave = useCallback(async () => {
    const pid = projectIdRef.current
    const pg = pageIdRef.current
    if (!pid || !pg) return
    await persistCanvasToPage(pid, pg, useAppStore.getState().components)
  }, [])

  // Bootstrap project routes: ensure default page and sync URL
  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    ;(async () => {
      setProjectError(null)
      setProjectLoading(true)
      try {
        const list = (await listPages(projectId)).data
        if (cancelled) return
        if (list.length === 0) {
          const home = await createPage(projectId, { name: 'Home' })
          if (cancelled) return
          navigate(paths.projectEditor(projectId, home.id), { replace: true })
          return
        }
        if (!pageId) {
          navigate(paths.projectEditor(projectId, list[0].id), { replace: true })
          return
        }
        const exists = list.some((p) => p.id === pageId)
        if (!exists) {
          navigate(paths.projectEditor(projectId, list[0].id), { replace: true })
          return
        }
        setPages(list)
      } catch (e) {
        if (!cancelled) {
          setProjectError(e instanceof Error ? e.message : 'Failed to load project')
        }
      } finally {
        if (!cancelled) setProjectLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, pageId, navigate])

  // Load canvas when page changes
  useEffect(() => {
    if (!projectId || !pageId) return
    let cancelled = false
    ;(async () => {
      try {
        const detail = await getPage(projectId, pageId)
        if (cancelled) return
        hydratingRef.current = true
        loadCanvasState(deserializeToComponentRecord(detail.components))
        queueMicrotask(() => {
          hydratingRef.current = false
        })
      } catch (e) {
        if (!cancelled) {
          setProjectError(e instanceof Error ? e.message : 'Failed to load page')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, pageId])

  // Autosave (project mode)
  useEffect(() => {
    if (!projectId || !pageId) return
    let timer: ReturnType<typeof setTimeout>
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.components === prev.components) return
      if (hydratingRef.current) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        void persistCanvasToPage(projectId, pageId, useAppStore.getState().components).catch(
          (err) => console.error('autosave failed', err),
        )
      }, 750)
    })
    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, [projectId, pageId])

  // Flush on unmount (project mode)
  useEffect(() => {
    return () => {
      const pid = projectIdRef.current
      const pg = pageIdRef.current
      if (!pid || !pg) return
      void persistCanvasToPage(pid, pg, useAppStore.getState().components).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) {
        return
      }

      if (e.metaKey || e.ctrlKey) {
        const key = e.key.toLowerCase()
        if (key === 'z') {
          e.preventDefault()
          if (e.shiftKey) canvasRedo()
          else canvasUndo()
          return
        }
        if (key === 'y' && e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          canvasRedo()
          return
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedIds } = useAppStore.getState()
        const toDel = selectedIds.filter((id) => id !== 'root')
        if (toDel.length > 0) {
          e.preventDefault()
          deleteComponents(toDel)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteComponents])

  function onDragEnd(event: DragEndEvent) {
    const overId = event.over?.id
    const data = event.active.data.current
    if (overId !== 'canvas:root') return
    if (!isPaletteDragData(data)) return

    const type = data.componentType
    const def = getDefinition(type)
    const defaults = def?.defaults ?? {}
    addComponentWithDefaults(type, 'root', defaults)
  }

  if (projectMode && projectLoading) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-8 text-sm text-[color:var(--color-muted)]">
        Loading project…
      </div>
    )
  }

  if (projectMode && projectError) {
    return (
      <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {projectError}
      </div>
    )
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editor</h1>
            <p className="text-sm text-[color:var(--color-muted)]">
              {projectMode
                ? 'Multi-page project: sidebar lists pages; canvas autosaves to the API.'
                : 'Local sandbox (no API). Open a project from Home to persist pages.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-fg)] hover:bg-black/5"
              onClick={() => {
                const html = buildExportedHtml(components, activeBreakpoint)
                openExportedHtmlPreview(html)
              }}
            >
              Preview
            </button>
            <button
              type="button"
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-fg)] hover:bg-black/5"
              onClick={() => {
                void downloadExportZip(components, activeBreakpoint)
              }}
            >
              Download ZIP
            </button>
            <button
              type="button"
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-fg)] hover:bg-black/5"
              onClick={() => {
                const html = buildExportedHtml(components, activeBreakpoint)
                downloadTextFile('page-export.html', html, 'text/html;charset=utf-8')
              }}
            >
              Export HTML
            </button>
            <button
              type="button"
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-fg)] hover:bg-black/5"
              onClick={() => {
                const tsx = buildExportedReactTailwind(components, activeBreakpoint)
                downloadTextFile('ExportedPage.tsx', tsx, 'text/typescript;charset=utf-8')
              }}
            >
              Export React + Tailwind
            </button>
            <UndoRedoToolbar />
            <div className="text-xs text-[color:var(--color-muted)]">
              Nodes: <span className="font-mono">{paletteCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 space-y-4 md:col-span-3">
            {projectMode && projectId && pageId ? (
              <PageSidebar
                projectId={projectId}
                pages={pages}
                activePageId={pageId}
                disabled={projectLoading}
                onBeforeNavigate={flushSave}
                onPagesChanged={refreshPages}
              />
            ) : null}
            <Palette />
            <LayerTree />
          </aside>

          <section className="col-span-12 space-y-3 md:col-span-6">
            <CanvasViewportProvider>
              <div className="flex flex-wrap items-center gap-2">
                <BreakpointToolbar />
                <CanvasZoomToolbar />
              </div>
              <Canvas />
            </CanvasViewportProvider>
          </section>

          <aside className="col-span-12 space-y-3 md:col-span-3">
            <Inspector />
            <HistoryPanel />
          </aside>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
          <div className="text-sm font-medium">Quick adds</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Text', 'Button', 'InputText', 'InputEmail', 'Textarea', 'Card', 'NavBar'].map((t) => (
              <button
                key={t}
                className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm hover:bg-black/5"
                type="button"
                onClick={() => {
                  const def = getDefinition(t)
                  const defaults = def?.defaults ?? {}
                  addComponentWithDefaults(t, 'root', defaults)
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  )
}
