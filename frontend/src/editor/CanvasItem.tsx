import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { CanvasItem as CanvasItemType, LayoutMode } from './types'
import { snapToGrid } from './layout'

export function CanvasItem({
  item,
  layoutMode,
  gridSize,
}: {
  item: CanvasItemType
  layoutMode: LayoutMode
  gridSize: number
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  })

  const deltaX = transform?.x ?? 0
  const deltaY = transform?.y ?? 0

  // Snap the *visual* delta during dragging in grid mode so the item appears to land
  // on grid cells immediately.
  const snappedDelta = layoutMode === 'grid' && isDragging
    ? {
        x: snapToGrid(item.x + deltaX, gridSize) - item.x,
        y: snapToGrid(item.y + deltaY, gridSize) - item.y,
      }
    : { x: deltaX, y: deltaY }

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        transform: CSS.Transform.toString({
          x: snappedDelta.x,
          y: snappedDelta.y,
          scaleX: 1,
          scaleY: 1,
        }),
        touchAction: 'none',
      }}
      className="bg-white border border-neutral-200 rounded shadow-sm select-none flex items-center justify-center"
      {...attributes}
      {...listeners}
      aria-label={`canvas-item-${item.id}`}
    >
      <span className="text-xs font-medium text-neutral-700">{item.label}</span>
    </div>
  )
}

