import { DndContext, PointerSensor, useSensor, type DragEndEvent } from '@dnd-kit/core'
import type { CSSProperties } from 'react'
import { useEditorStore } from './store'
import { applyDragDelta } from './layout'
import { CanvasItem } from './CanvasItem'
import { useMemo } from 'react'

function makeGridBackground(gridSize: number): CSSProperties {
  const lineColor = 'rgba(0,0,0,0.08)'
  return {
    backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
    backgroundSize: `${gridSize}px ${gridSize}px`,
  }
}

export function Canvas() {
  const layoutMode = useEditorStore((s) => s.layoutMode)
  const gridSize = useEditorStore((s) => s.gridSize)
  const items = useEditorStore((s) => s.items)
  const moveItemTo = useEditorStore((s) => s.moveItemTo)

  const sensors = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  })

  const gridBackground = useMemo(() => {
    if (layoutMode !== 'grid') return undefined
    return makeGridBackground(gridSize)
  }, [gridSize, layoutMode])

  const onDragEnd = (event: DragEndEvent) => {
    const id = String(event.active.id)
    const item = items.find((x) => x.id === id)
    if (!item) return

    const next = applyDragDelta({
      start: { x: item.x, y: item.y },
      delta: { x: event.delta.x, y: event.delta.y },
      mode: layoutMode,
      gridSize,
    })

    moveItemTo(id, next)
  }

  const canvasBaseBackground =
    layoutMode === 'grid'
      ? { backgroundColor: '#ffffff', ...gridBackground }
      : { backgroundColor: '#f5f5f5', backgroundImage: 'none' }

  return (
    <DndContext sensors={[sensors]} onDragEnd={onDragEnd}>
      <div
        className="relative rounded border border-neutral-300 shadow-sm overflow-hidden"
        style={{
          width: 900,
          height: 520,
          ...canvasBaseBackground,
        }}
        aria-label="canvas"
      >
        {/* Render all items from the store. DnD snapping is handled both visually (during drag) and
            behaviorally (on drag end) so switching modes behaves predictably. */}
        {items.map((item) => (
          <CanvasItem key={item.id} item={item} layoutMode={layoutMode} gridSize={gridSize} />
        ))}
      </div>
    </DndContext>
  )
}

