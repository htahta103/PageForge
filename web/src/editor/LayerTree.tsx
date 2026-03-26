import type { ComponentId, ComponentNode } from '../types/components'
import { getDefinition } from '../registry/registry'
import { useAppStore } from '../store/useAppStore'

function LayerRow({
  id,
  depth,
  components,
  selectedIds,
  selectOne,
}: {
  id: ComponentId
  depth: number
  components: Record<ComponentId, ComponentNode>
  selectedIds: ComponentId[]
  selectOne: (id: ComponentId | null) => void
}) {
  const node = components[id]
  if (!node) return null

  const def = getDefinition(node.type)
  const label = def?.title ?? node.type
  const selected = selectedIds.includes(id)

  return (
    <li>
      <button
        type="button"
        className={[
          'w-full rounded-md border border-transparent px-2 py-1.5 text-left text-sm transition-colors',
          selected
            ? 'border-[color:var(--color-primary)]/40 bg-[color:var(--color-primary)]/10 font-medium text-[color:var(--color-foreground)]'
            : 'text-[color:var(--color-foreground)] hover:bg-black/5',
        ].join(' ')}
        style={{ paddingLeft: `${10 + depth * 14}px` }}
        onClick={() => selectOne(id)}
      >
        <span className="block truncate">{label}</span>
        <span className="block truncate font-mono text-[11px] text-[color:var(--color-muted)]">{node.type}</span>
      </button>
      {node.children.length > 0 ? (
        <ul className="ml-2 list-none border-l border-[color:var(--color-border)]/80 pl-1">
          {node.children.map((childId) => (
            <LayerRow
              key={childId}
              id={childId}
              depth={depth + 1}
              components={components}
              selectedIds={selectedIds}
              selectOne={selectOne}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function LayerTree() {
  const components = useAppStore((s) => s.components)
  const selectedIds = useAppStore((s) => s.selectedIds)
  const selectOne = useAppStore((s) => s.selectOne)
  const ensureInitialized = useAppStore((s) => s.ensureInitialized)

  ensureInitialized()

  if (!components.root) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Layers</div>
        <div className="text-xs text-[color:var(--color-muted)]">outline</div>
      </div>
      <nav aria-label="Component layers" className="max-h-[min(480px,50vh)] overflow-y-auto rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-2">
        <ul className="list-none space-y-0.5">
          <LayerRow id="root" depth={0} components={components} selectedIds={selectedIds} selectOne={selectOne} />
        </ul>
      </nav>
    </div>
  )
}
