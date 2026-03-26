import { useCallback, useState } from 'react'
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
import {
  isNodeLocked,
  isNodeVisible,
  layerDisplayName,
  useAppStore,
} from '../store/useAppStore'

const ROW_PREFIX = 'layer-row:'
const GAP_PREFIX = 'layer-gap:'
const INTO_PREFIX = 'layer-into:'
const ROOT_ID: ComponentId = 'root'

function IconEye(props: { off?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden
      className={props.className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {props.off ? (
        <>
          <path d="M10.733 5.076A10.744 10.744 0 0 1 21.938 11.65a1 1 0 0 1 0 .696 10.747 10.747 0 0 1-4.462 5.463" />
          <path d="M14.066 14.073a3 3 0 1 1-2.167-4.123" />
          <path d="m2 2 20 20" />
          <path d="M6.713 6.723A10.744 10.744 0 0 0 2.118 11.65a1 1 0 0 0 0 .696 10.747 10.747 0 0 0 12.171.696" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

function IconLock(props: { locked?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden
      className={props.className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {props.locked ? (
        <>
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      ) : (
        <>
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1 4 4 0 0 1 2.9 1.4" />
        </>
      )}
    </svg>
  )
}

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
  const setMeta = useAppStore((s) => s.setMeta)

  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')

  const startRename = useCallback(() => {
    if (!node || isNodeLocked(node)) return
    setDraftName(layerDisplayName(node))
    setRenaming(true)
  }, [node])

  const commitRename = useCallback(() => {
    if (!node) return
    const next = draftName.trim()
    if (next) setMeta(node.id, { name: next })
    setRenaming(false)
  }, [draftName, node, setMeta])

  const cancelRename = useCallback(() => {
    setRenaming(false)
  }, [])

  const { setNodeRef: setIntoRef, isOver: overInto } = useDroppable({
    id: `${INTO_PREFIX}${id}`,
  })

  const isRoot = id === ROOT_ID
  const locked = node ? isNodeLocked(node) : false
  const visible = node ? isNodeVisible(node) : true
  const canToggleVisibility = !isRoot

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `${ROW_PREFIX}${id}`,
    data: { kind: 'layer', componentId: id },
    disabled: isRoot || locked,
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
        <div
          className={[
            'flex min-h-8 items-center gap-1 px-1 py-0.5',
            !visible ? 'opacity-70' : '',
          ].join(' ')}
          role="treeitem"
          aria-selected={selected}
        >
          {isRoot ? (
            <span className="inline-flex w-7 justify-center text-[color:var(--color-muted)]" aria-hidden>
              ◆
            </span>
          ) : (
            <button
              ref={setDragRef}
              type="button"
              disabled={locked}
              className={[
                'inline-flex w-7 shrink-0 items-center justify-center rounded text-[color:var(--color-muted)] hover:bg-black/5 active:cursor-grabbing',
                locked ? 'cursor-not-allowed opacity-40' : 'cursor-grab',
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
            title={
              canToggleVisibility ? (visible ? 'Hide on canvas' : 'Show on canvas') : 'Root is always visible on canvas'
            }
            disabled={!canToggleVisibility}
            className={[
              'inline-flex shrink-0 rounded p-0.5 text-[color:var(--color-muted)] hover:bg-black/10 hover:text-[color:var(--color-foreground)]',
              !canToggleVisibility ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : '',
            ].join(' ')}
            onClick={(e) => {
              e.stopPropagation()
              if (!canToggleVisibility) return
              setMeta(id, { visible: !visible })
            }}
          >
            <IconEye off={!visible} className="shrink-0" />
          </button>

          <button
            type="button"
            title={locked ? 'Unlock layer' : 'Lock layer (no select / edit)'}
            className="inline-flex shrink-0 rounded p-0.5 text-[color:var(--color-muted)] hover:bg-black/10 hover:text-[color:var(--color-foreground)]"
            onClick={(e) => {
              e.stopPropagation()
              setMeta(id, { locked: !locked })
            }}
          >
            <IconLock locked={locked} className="shrink-0" />
          </button>

          {renaming ? (
            <input
              autoFocus
              className="min-w-0 flex-1 rounded border border-[color:var(--color-border)] bg-white px-1.5 py-0.5 text-sm"
              value={draftName}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => commitRename()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitRename()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  cancelRename()
                }
              }}
            />
          ) : (
            <button
              type="button"
              className={[
                'min-w-0 flex-1 truncate rounded px-1 text-left text-sm',
                !visible ? 'text-[color:var(--color-muted)] line-through' : '',
                locked ? 'cursor-default' : '',
                selected ? 'font-medium text-[color:var(--color-primary)]' : '',
              ].join(' ')}
              title={locked ? undefined : 'Double-click to rename'}
              onClick={(e) => {
                e.stopPropagation()
                selectOne(id)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                startRename()
              }}
            >
              <span className="font-mono text-xs text-[color:var(--color-muted)]">{node.type}</span>
              <span className="ml-2 truncate">{layerDisplayName(node)}</span>
            </button>
          )}
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
            <div className="text-xs text-[color:var(--color-muted)]">drag · eye · lock</div>
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
        <div
          className="max-h-[min(480px,50vh)] overflow-y-auto rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-2"
          role="tree"
          aria-label="Layers"
        >
          <LayerRow id={ROOT_ID} depth={0} />
        </div>
      </div>
    </DndContext>
  )
}
