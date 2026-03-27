import { useDroppable } from '@dnd-kit/core'
import { createContext, useCallback, useMemo, useRef, useState } from 'react'

import { useT } from '@/i18n/context'
import { getRootIds } from '@/lib/tree'
import { useEditorStore } from '@/store/editorStore'

import { CanvasNode } from './CanvasNode'

type GuideState = { x: number | null; y: number | null }

export const CanvasDragContext = createContext<{
  beginDrag: (id: string) => void
  updateGuides: (id: string) => void
  endDrag: () => void
} | null>(null)

const ALIGN_THRESHOLD_PX = 6

export function Canvas() {
  const t = useT()
  const components = useEditorStore((s) => s.components)
  const roots = useMemo(() => getRootIds(components), [components])
  const select = useEditorStore((s) => s.select)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [guides, setGuides] = useState<GuideState>({ x: null, y: null })

  const { setNodeRef, isOver } = useDroppable({ id: 'drop-root' })
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      canvasRef.current = el
      setNodeRef(el)
    },
    [setNodeRef],
  )

  const beginDrag = useCallback(() => {
    setGuides({ x: null, y: null })
  }, [])

  const endDrag = useCallback(() => {
    setGuides({ x: null, y: null })
  }, [])

  const updateGuides = useCallback((id: string) => {
    const root = canvasRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>(`[data-canvas-node-id="${id}"]`)
    if (!active) return
    const activeRect = active.getBoundingClientRect()

    const activeCenterX = activeRect.left + activeRect.width / 2
    const activeCenterY = activeRect.top + activeRect.height / 2
    const pointsX = [activeRect.left, activeCenterX, activeRect.right]
    const pointsY = [activeRect.top, activeCenterY, activeRect.bottom]

    let bestXPoint: number | null = null
    let bestYPoint: number | null = null
    let bestXDelta = Number.POSITIVE_INFINITY
    let bestYDelta = Number.POSITIVE_INFINITY
    const nodes = root.querySelectorAll<HTMLElement>('[data-canvas-node-id]')
    nodes.forEach((node) => {
      if (node.dataset.canvasNodeId === id) return
      const rect = node.getBoundingClientRect()
      const refX = [rect.left, rect.left + rect.width / 2, rect.right]
      const refY = [rect.top, rect.top + rect.height / 2, rect.bottom]

      for (const px of pointsX) {
        for (const rx of refX) {
          const delta = Math.abs(px - rx)
          if (delta > ALIGN_THRESHOLD_PX) continue
          if (delta < bestXDelta) {
            bestXDelta = delta
            bestXPoint = rx
          }
        }
      }
      for (const py of pointsY) {
        for (const ry of refY) {
          const delta = Math.abs(py - ry)
          if (delta > ALIGN_THRESHOLD_PX) continue
          if (delta < bestYDelta) {
            bestYDelta = delta
            bestYPoint = ry
          }
        }
      }
    })

    const rootRect = root.getBoundingClientRect()
    const guideX = bestXPoint === null ? null : bestXPoint - rootRect.left
    const guideY = bestYPoint === null ? null : bestYPoint - rootRect.top
    setGuides({ x: guideX, y: guideY })
  }, [])

  return (
    <CanvasDragContext.Provider value={{ beginDrag, updateGuides, endDrag }}>
      <div
        ref={setRefs}
        className={[
          'relative min-h-[480px] rounded-xl border-2 border-dashed border-neutral-300 bg-white p-4',
          isOver ? 'border-blue-400 bg-blue-50/40' : '',
        ].join(' ')}
        data-testid="editor-canvas"
        onClick={() => select([])}
        onKeyDown={(e) => {
          if (e.key === 'Escape') select([])
        }}
        role="presentation"
      >
        {guides.x !== null && (
          <div
            className="pointer-events-none absolute bottom-4 top-4 z-40 w-px bg-blue-400/70"
            style={{ left: `${guides.x}px` }}
          />
        )}
        {guides.y !== null && (
          <div
            className="pointer-events-none absolute left-4 right-4 z-40 h-px bg-blue-400/70"
            style={{ top: `${guides.y}px` }}
          />
        )}

        {roots.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('editor.canvas.empty')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {roots.map((id) => (
              <CanvasNode key={id} id={id} />
            ))}
          </div>
        )}
      </div>
    </CanvasDragContext.Provider>
  )
}
