import { useDraggable } from '@dnd-kit/core'
import { paletteOrder, componentRegistry } from './registry'
import { paletteDragId } from './dnd'

function PaletteItem({ type }: { type: (typeof paletteOrder)[number] }) {
  const reg = componentRegistry[type]
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: paletteDragId(type),
  })

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        'w-full flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left',
        'hover:bg-neutral-50 active:bg-neutral-100',
        isDragging ? 'opacity-50' : '',
      ].join(' ')}
      type="button"
    >
      <span className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center text-xs">
        {reg.icon}
      </span>
      <div className="flex-1">
        <div className="text-sm font-medium text-neutral-900">{reg.label}</div>
        <div className="text-xs text-neutral-500">Drag to canvas</div>
      </div>
    </button>
  )
}

export function Palette() {
  return (
    <aside className="w-72 shrink-0 border-r border-neutral-200 bg-neutral-50">
      <div className="p-4">
        <div className="text-xs font-semibold tracking-wide text-neutral-600">
          COMPONENTS
        </div>
        <div className="mt-3 space-y-2">
          {paletteOrder.map((type) => (
            <PaletteItem key={type} type={type} />
          ))}
        </div>
      </div>
    </aside>
  )
}

