import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useAppStore } from '../store/useAppStore'
import { getDefinition } from '../registry/registry'
import { BreakpointToolbar } from '../editor/BreakpointToolbar'
import { Palette } from '../editor/Palette'
import { Canvas } from '../editor/Canvas'
import { Inspector } from '../editor/Inspector'

type PaletteDragData = { kind: 'palette'; componentType: string }

function isPaletteDragData(value: unknown): value is PaletteDragData {
  if (!value || typeof value !== 'object') return false
  const v = value as { kind?: unknown; componentType?: unknown }
  return v.kind === 'palette' && typeof v.componentType === 'string'
}

export function EditorPage() {
  const ensureInitialized = useAppStore((s) => s.ensureInitialized)
  const addComponent = useAppStore((s) => s.addComponent)
  const components = useAppStore((s) => s.components)

  ensureInitialized()

  const hasRoot = Boolean(components.root)
  const paletteCount = Object.keys(components).length - (hasRoot ? 1 : 0)

  function onDragEnd(event: DragEndEvent) {
    const overId = event.over?.id
    const data = event.active.data.current
    if (overId !== 'canvas:root') return
    if (!isPaletteDragData(data)) return

    const type = data.componentType
    const def = getDefinition(type)
    const id = addComponent(type)
    const defaults = def?.defaults ?? {}
    for (const [k, v] of Object.entries(defaults)) {
      useAppStore.getState().setProp(id, k, v)
    }
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editor</h1>
            <p className="text-sm text-[color:var(--color-muted)]">
              Minimal WYSIWYG scaffold: palette → canvas → inspector.
            </p>
          </div>
          <div className="text-xs text-[color:var(--color-muted)]">
            Nodes: <span className="font-mono">{paletteCount}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 space-y-3 md:col-span-3">
            <Palette />
          </aside>

          <section className="col-span-12 space-y-3 md:col-span-6">
            <BreakpointToolbar />
            <Canvas />
          </section>

          <aside className="col-span-12 space-y-3 md:col-span-3">
            <Inspector />
          </aside>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
          <div className="text-sm font-medium">Quick adds</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['InputText', 'InputEmail', 'Textarea', 'Card', 'NavBar'].map((t) => (
              <button
                key={t}
                className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm hover:bg-black/5"
                type="button"
                onClick={() => {
                  const def = getDefinition(t)
                  const id = addComponent(t)
                  const defaults = def?.defaults ?? {}
                  for (const [k, v] of Object.entries(defaults)) {
                    useAppStore.getState().setProp(id, k, v)
                  }
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

