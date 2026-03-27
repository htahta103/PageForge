import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useT } from '@/i18n/context'
import { exportPage } from '@/lib/api/export'
import { findParentId } from '@/lib/tree'
import { getRegistration } from '@/registry'
import { useEditorStore, useTemporalEditor } from '@/store/editorStore'
import type { ComponentType } from '@/types/api'

import { Canvas } from './Canvas'
import { ComponentPalette } from './ComponentPalette'
import { ExportModal } from './ExportModal'
import { LayerTree } from './LayerTree'
import { PropertyPanel } from './PropertyPanel'

export function EditorScreen() {
  const t = useT()
  const { projectId = '', pageId = '' } = useParams()

  const load = useEditorStore((s) => s.load)
  const save = useEditorStore((s) => s.save)
  const loadState = useEditorStore((s) => s.loadState)
  const saveState = useEditorStore((s) => s.saveState)
  const pageName = useEditorStore((s) => s.pageName)
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const setBreakpoint = useEditorStore((s) => s.setBreakpoint)
  const addComponent = useEditorStore((s) => s.addComponent)
  const reorderWithinParent = useEditorStore((s) => s.reorderWithinParent)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)

  const temporal = useTemporalEditor()

  const [exportOpen, setExportOpen] = useState(false)
  const [exportText, setExportText] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  useEffect(() => {
    if (!projectId || !pageId) return
    void load(projectId, pageId)
    // `load` comes from zustand; in practice it should be referentially stable.
    // Avoid depending on it to prevent accidental render loops if the selector
    // returns a new function reference.
  }, [projectId, pageId])

  async function onExport(format: 'html' | 'react') {
    try {
      const res = await exportPage(projectId, pageId, format)
      const text = res.files
        .map((f) => `// ${f.path}\n${f.content}`)
        .join('\n\n')
      setExportText(text)
      setExportOpen(true)
    } catch {
      setExportText(t('editor.export.error'))
      setExportOpen(true)
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const a = active.data.current as
      | { source: 'palette'; type: ComponentType }
      | { source: 'layer' }
      | undefined

    if (a?.source === 'palette') {
      const overId = over.id.toString()
      if (overId !== 'drop-root' && !overId.startsWith('drop-')) return
      let parentId: string | null = null
      if (overId === 'drop-root') parentId = null
      else parentId = overId.slice('drop-'.length)

      const reg = getRegistration(a.type)
      const displayName = reg ? t(reg.labelKey) : String(a.type)
      addComponent(a.type, parentId, displayName)
      return
    }

    if (a?.source === 'layer') {
      const activeId = String(active.id)
      const overId = String(over.id)
      const map = useEditorStore.getState().components
      const p1 = findParentId(map, activeId)
      const p2 = findParentId(map, overId)
      if (p1 === p2) {
        reorderWithinParent(p1, activeId, overId)
      }
    }
  }

  if (loadState.status === 'loading') {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-fg-muted">
        {t('editor.loading')}
      </div>
    )
  }

  if (loadState.status === 'error') {
    return (
      <div className="space-y-3 rounded-lg border border-danger-border bg-danger-bg p-6 text-sm text-danger-fg">
        <div>{t('editor.loadError')}</div>
        <button
          type="button"
          className="rounded-md border border-danger-border bg-surface px-3 py-1.5 text-sm font-medium text-danger-fg"
          onClick={() => void load(projectId, pageId)}
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="space-y-4" data-testid="editor-screen">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-fg-subtle">
              <Link className="text-link hover:underline" to={`/projects/${projectId}`}>
                {t('nav.projectPages')}
              </Link>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
              {t('editor.title')}: {pageName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-surface p-1">
              {(
                [
                  ['desktop', 'editor.breakpoint.desktop'],
                  ['tablet', 'editor.breakpoint.tablet'],
                  ['mobile', 'editor.breakpoint.mobile'],
                ] as const
              ).map(([bp, key]) => (
                <button
                  key={bp}
                  type="button"
                  onClick={() => setBreakpoint(bp)}
                  className={[
                    'rounded-md px-2 py-1 text-xs font-medium',
                    activeBreakpoint === bp
                      ? 'bg-inverse text-inverse-fg'
                      : 'text-fg-muted hover:bg-muted',
                  ].join(' ')}
                >
                  {t(key)}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => temporal.getState().undo()}
            >
              {t('editor.undo')}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => temporal.getState().redo()}
            >
              {t('editor.redo')}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => void deleteSelected()}
            >
              {t('common.delete')}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => void onExport('html')}
            >
              {t('editor.export.html')}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-muted"
              onClick={() => void onExport('react')}
            >
              {t('editor.export.react')}
            </button>

            <button
              type="button"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              disabled={saveState.status === 'saving'}
              onClick={() => void save()}
              data-testid="editor-save"
            >
              {saveState.status === 'saving'
                ? t('editor.saving')
                : saveState.status === 'saved'
                  ? t('editor.saved')
                  : t('editor.save')}
            </button>
          </div>
        </div>

        {saveState.status === 'error' && (
          <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-fg">
            {t('editor.saveError')}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <aside className="lg:col-span-3 space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <ComponentPalette />
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <LayerTree />
            </div>
          </aside>

          <section
            className="lg:col-span-6 [color-scheme:light]"
            data-testid="editor-canvas-column"
          >
            <Canvas />
          </section>

          <aside className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <PropertyPanel />
            </div>
          </aside>
        </div>
      </div>

      <ExportModal
        open={exportOpen}
        title={t('export.modal.title')}
        content={exportText}
        onClose={() => setExportOpen(false)}
      />
    </DndContext>
  )
}
