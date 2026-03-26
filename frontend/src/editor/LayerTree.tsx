import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo } from 'react'

import { useT } from '@/i18n/context'
import { getRootIds, getSortedChildrenIds } from '@/lib/tree'
import { useEditorStore } from '@/store/editorStore'
import type { Component } from '@/types/api'

function SortableRow({
  id,
  depth,
  component,
}: {
  id: string
  depth: number
  component: Component
}) {
  const t = useT()
  const select = useEditorStore((s) => s.select)
  const selected = useEditorStore((s) => s.selectedIds.includes(id))

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { source: 'layer' as const } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        style={style}
        className={[
          'flex items-center gap-2 rounded-md border px-2 py-1 text-sm',
          selected ? 'border-blue-400 bg-blue-50' : 'border-neutral-200 bg-white',
          isDragging ? 'opacity-70' : '',
        ].join(' ')}
      >
        <button
          type="button"
          className="cursor-grab text-neutral-400 hover:text-neutral-700"
          aria-label={t('editor.layers.dragHandle')}
          {...attributes}
          {...listeners}
        >
          ∷
        </button>
        <button
          type="button"
          className="flex-1 truncate text-left font-medium text-neutral-800"
          onClick={() => select([id])}
        >
          {component.meta.name}
        </button>
        <span className="text-xs text-neutral-500">{component.type}</span>
      </div>
      {(component.type === 'container' ||
        component.type === 'card' ||
        component.type === 'nav' ||
        component.type === 'list') && (
        <LayerGroup parentId={id} depth={depth + 1} />
      )}
    </div>
  )
}

function LayerGroup({
  parentId,
  depth,
}: {
  parentId: string | null
  depth: number
}) {
  const map = useEditorStore((s) => s.components)
  const ids = useMemo(() => {
    if (!parentId) return getRootIds(map)
    return getSortedChildrenIds(map, parentId)
  }, [map, parentId])

  if (ids.length === 0) return null

  return (
    <div style={{ marginLeft: depth * 14 }}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {ids.map((id) => {
            const c = map[id]
            if (!c) return null
            return (
              <SortableRow key={id} id={id} depth={depth} component={c} />
            )
          })}
        </div>
      </SortableContext>
    </div>
  )
}

export function LayerTree() {
  const t = useT()
  const hasRoots = useEditorStore((s) => getRootIds(s.components).length > 0)

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {t('editor.layers.title')}
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-2">
        {hasRoots ? (
          <LayerGroup parentId={null} depth={0} />
        ) : (
          <p className="text-xs text-neutral-500">{t('editor.layers.empty')}</p>
        )}
      </div>
    </div>
  )
}
