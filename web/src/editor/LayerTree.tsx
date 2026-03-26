import { useCallback } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { ComponentId } from '../types/components'
import { useAppStore } from '../store/useAppStore'

const ROW_PREFIX = 'layer-row:'
const GAP_PREFIX = 'layer-gap:'
const INTO_PREFIX = 'layer-into:'

function LayerGap({ parentId, index }: { parentId: ComponentId; index: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${GAP_PREFIX}${parentId}:${index}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={[
        'mx-1 h-2 shrink-0 rounded-sm transition-colors',
        isOver ? 'bg-[color:var(--color-primary)]/50' : 'bg-transparent hover:bg-black/10',
      ].join(' ')}
      aria-hidden
    />
  )
}

function LayerRow({ id, depth }: { id: ComponentId; depth: number }) {
  const node = useAppStore((s) => s.components[id])
  const selected = useAppStore((s) => s.selectedIds.includes(id))
  const selectOne = useAppStore((s) => s.selectOne)

  const { setNodeRef: setIntoRef, isOver: overInto } = useDroppable({
    id: `${INTO_PREFIX}${id}`,
  })

  const isRoot = id === 'root'
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `${ROW_PREFIX}${id}`,
    data: { kind: 'layer', componentId: id },
    disabled: isRoot,
  })

  if (!node) return null

  const indentPx = depth * 12

  return (
    <div className="select-none">
      <div
        ref={setIntoRef}
        className={[
          'rounded-[var(--radius-md)] border border-transparent transition-colors',
          overInto ? 'border-[color:var(--color-primary)]/40 bg-[color:var(--color-primary)]/5' : '',
          selected ? 'bg-[color:var(--color-primary)]/10' : '',
        ].join(' ')}
        style={{ marginLeft: indentPx }}
      >
        <div className="flex items-center gap-1 px-1 py-1">
          {isRoot ? (
            <span className="inline-flex w-7 justify-center text-[color:var(--color-muted)]" aria-hidden>
              ◆
            </span>
          ) : (
            <button
              ref={setDragRef}
              type="button"
              className={[
                'inline-flex w-7 shrink-0 cursor-grab items-center justify-center rounded text-[color:var(--color-muted)] hover:bg-black/5 active:cursor-grabbing',
                isDragging ? 'opacity-60' : '',
              ].join(' ')}
              aria-label={`Drag ${node.type}`}
              {...listeners}
              {...attributes}
            >
              ⋮⋮
            </button>
          )}
          <button
            type="button"
            className={[
              'min-w-0 flex-1 truncate rounded px-2 py-1 text-left text-sm hover:bg-black/5',
              selected ? 'font-medium text-[color:var(--color-primary)]' : '',
            ].join(' ')}
            onClick={() => selectOne(id)}
          >
            <span className="font-mono text-xs text-[color:var(--color-muted)]">{node.type}</span>
            {!isRoot ? (
              <span className="ml-2 text-[11px] text-[color:var(--color-muted)]/80">
                {node.id.slice(0, 8)}…
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {node.children.length > 0 ? (
        <div className="mt-0.5 border-l border-[color:var(--color-border)]/60 pl-1">
          <LayerBranch parentId={id} depth={depth + 1} />
        </div>
      ) : null}
    </div>
  )
}

function LayerBranch({ parentId, depth }: { parentId: ComponentId; depth: number }) {
  const children = useAppStore((s) => s.components[parentId]?.children ?? [])

  return (
    <div className="flex flex-col">
      {children.map((childId, i) => (
        <div key={childId} className="flex flex-col">
          <LayerGap parentId={parentId} index={i} />
          <LayerRow id={childId} depth={depth} />
        </div>
      ))}
      <LayerGap parentId={parentId} index={children.length} />
    </div>
  )
}

function parseRowId(activeId: string): ComponentId | null {
  if (!activeId.startsWith(ROW_PREFIX)) return null
  return activeId.slice(ROW_PREFIX.length)
}

function handleLayerDragEnd(event: DragEndEvent) {
  const over = event.over
  if (!over) return

  const draggedId = parseRowId(String(event.active.id))
  if (!draggedId) return

  const oid = String(over.id)

  if (oid.startsWith(GAP_PREFIX)) {
    const rest = oid.slice(GAP_PREFIX.length)
    const lastColon = rest.lastIndexOf(':')
    if (lastColon < 0) return
    const parentId = rest.slice(0, lastColon)
    const index = Number(rest.slice(lastColon + 1))
    if (!parentId || Number.isNaN(index)) return
    useAppStore.getState().moveNode(draggedId, parentId, index)
    return
  }

  if (oid.startsWith(INTO_PREFIX)) {
    const parentId = oid.slice(INTO_PREFIX.length)
    if (!parentId) return
    const dest = useAppStore.getState().components[parentId]
    const len = dest?.children.length ?? 0
    useAppStore.getState().moveNode(draggedId, parentId, len)
  }
}

export function LayerTree() {
  const ensureInitialized = useAppStore((s) => s.ensureInitialized)
  ensureInitialized()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const onDragEnd = useCallback((e: DragEndEvent) => {
    handleLayerDragEnd(e)
  }, [])

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold">Layers</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-[color:var(--color-muted)]">drag to reorder</div>
            <button
              type="button"
              className="rounded-md border border-[color:var(--color-border)] px-2 py-0.5 text-xs hover:bg-black/5"
              onClick={() => useAppStore.temporal.getState().undo()}
            >
              Undo
            </button>
            <button
              type="button"
              className="rounded-md border border-[color:var(--color-border)] px-2 py-0.5 text-xs hover:bg-black/5"
              onClick={() => useAppStore.temporal.getState().redo()}
            >
              Redo
            </button>
          </div>
        </div>
        <div className="max-h-[min(480px,50vh)] overflow-y-auto rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-2">
          <LayerRow id="root" depth={0} />
        </div>
      </div>
    </DndContext>
  )
}
