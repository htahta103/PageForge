import { useDroppable } from '@dnd-kit/core'
import type { ComponentId } from '../types/components'
import { getDefinition } from '../registry/registry'
import { useAppStore } from '../store/useAppStore'

function NodeView({ id }: { id: ComponentId }) {
  const node = useAppStore((s) => s.components[id])
  const selectOne = useAppStore((s) => s.selectOne)
  const selectedIds = useAppStore((s) => s.selectedIds)

  if (!node) return null
  const def = getDefinition(node.type)
  const children = node.children.map((cid) => <NodeView key={cid} id={cid} />)
  const selected = selectedIds.includes(id)

  const rendered = def?.render(node, children) ?? (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3 text-sm">
      Unknown component: <code className="font-mono">{node.type}</code>
    </div>
  )

  return (
    <div
      className={[
        'rounded-[var(--radius-md)] outline-none ring-offset-2',
        selected ? 'ring-2 ring-[color:var(--color-primary)]' : 'hover:ring-1 hover:ring-black/10',
      ].join(' ')}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        selectOne(id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          selectOne(id)
        }
      }}
    >
      {rendered}
    </div>
  )
}

export function Canvas() {
  const ensureInitialized = useAppStore((s) => s.ensureInitialized)
  const addComponent = useAppStore((s) => s.addComponent)
  const selectOne = useAppStore((s) => s.selectOne)

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas:root',
  })

  ensureInitialized()

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-[var(--radius-md)] p-2',
        isOver ? 'bg-[color:var(--color-primary)]/10' : '',
      ].join(' ')}
      onClick={() => selectOne(null)}
    >
      <NodeView id="root" />

      <div className="mt-3 text-xs text-[color:var(--color-muted)]">
        Tip: Drag from palette onto the canvas, or click “Add”.
        <button
          className="ml-2 rounded-md border border-[color:var(--color-border)] px-2 py-1 hover:bg-black/5"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            addComponent('Card')
          }}
        >
          Quick add Card
        </button>
      </div>
    </div>
  )
}

