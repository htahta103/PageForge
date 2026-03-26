import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useEffect } from 'react'
import { canvasRedo, canvasUndo, useAppStore } from '../store/useAppStore'
import { getDefinition } from '../registry/registry'
import { BreakpointToolbar } from '../editor/BreakpointToolbar'
import { LayerTree } from '../editor/LayerTree'
import { Palette } from '../editor/Palette'
import { Canvas } from '../editor/Canvas'
import { CanvasViewportProvider } from '../editor/CanvasViewportContext'
import { CanvasZoomToolbar } from '../editor/CanvasZoomToolbar'
import { Inspector } from '../editor/Inspector'
import { UndoRedoToolbar } from '../editor/UndoRedoToolbar'
import { buildExportedHtml, downloadTextFile } from '../utils/exportHtmlCss'

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
  const ensureInitialized = useAppStore((s) => s.ensureInitialized)
  const addComponent = useAppStore((s) => s.addComponent)
  const deleteComponents = useAppStore((s) => s.deleteComponents)
  const components = useAppStore((s) => s.components)
  const activeBreakpoint = useAppStore((s) => s.activeBreakpoint)

  ensureInitialized()

  const hasRoot = Boolean(components.root)
  const paletteCount = Object.keys(components).length - (hasRoot ? 1 : 0)

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
    addComponent(type, 'root', defaults)
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editor</h1>
            <p className="text-sm text-[color:var(--color-muted)]">
              Minimal WYSIWYG scaffold: palette → canvas → inspector.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <UndoRedoToolbar />
            <div className="text-xs text-[color:var(--color-muted)]">
              Nodes: <span className="font-mono">{paletteCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 space-y-4 md:col-span-3">
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
                  addComponent(t, 'root', defaults)
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

