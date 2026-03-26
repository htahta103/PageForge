import { useDroppable } from '@dnd-kit/core'
import { useEditorStore } from './store'
import { containerDropId, DND_KIND } from './dnd'
import { renderNode } from './render'
import type React from 'react'

function ContainerDropZone({
  containerId,
  children,
}: {
  containerId: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: containerDropId(containerId),
  })

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}
    >
      {children}
    </div>
  )
}

function NodeView({ id }: { id: string }) {
  const node = useEditorStore((s) => s.components[id])
  const childIds = node?.children ?? []

  if (!node) return null

  const children = (
    <div className="space-y-3">
      {childIds.map((childId) => (
        <NodeView key={childId} id={childId} />
      ))}
    </div>
  )

  const rendered = renderNode(node, children)

  if (node.type === 'container') {
    return <ContainerDropZone containerId={node.id}>{rendered}</ContainerDropZone>
  }

  return rendered
}

export function Canvas() {
  const rootIds = useEditorStore((s) => s.rootIds)
  const { setNodeRef, isOver } = useDroppable({ id: DND_KIND.dropRoot })

  return (
    <main className="flex-1 bg-neutral-100 p-6 overflow-auto">
      <div
        ref={setNodeRef}
        className={[
          'mx-auto max-w-4xl min-h-[70vh] rounded-xl border border-neutral-200 bg-white p-6',
          isOver ? 'ring-2 ring-blue-500 ring-offset-2' : '',
        ].join(' ')}
      >
        {rootIds.length === 0 ? (
          <div className="h-full min-h-[50vh] flex items-center justify-center text-sm text-neutral-500">
            Drag components here to start building
          </div>
        ) : (
          <div className="space-y-4">
            {rootIds.map((id) => (
              <NodeView key={id} id={id} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

