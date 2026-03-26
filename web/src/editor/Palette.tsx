import { useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { registry } from '../registry/registry'
import { useAppStore } from '../store/useAppStore'

const ROOT_ID = 'root'

function PaletteItem({ type, title }: { type: string; title: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { kind: 'palette', componentType: type },
  })

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex items-center justify-between gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2 text-sm',
        'cursor-grab select-none hover:bg-black/5',
        isDragging ? 'opacity-60' : '',
      ].join(' ')}
      {...listeners}
      {...attributes}
    >
      <div className="font-medium">{title}</div>
      <div className="text-xs text-[color:var(--color-muted)]">{type}</div>
    </div>
  )
}

export function Palette() {
  const addComponent = useAppStore((s) => s.addComponent)

  const items = useMemo(() => {
    const defs = Object.values(registry).filter((d) => d.type !== 'Root')
    return defs.sort((a, b) => a.title.localeCompare(b.title))
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Palette</div>
        <div className="text-xs text-[color:var(--color-muted)]">drag or click</div>
      </div>
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.type} className="space-y-1">
            <PaletteItem type={d.type} title={d.title} />
            <button
              className="w-full rounded-md border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-muted)] hover:bg-black/5"
              type="button"
              onClick={() => {
                addComponent(d.type, ROOT_ID, d.defaults ?? {})
              }}
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

