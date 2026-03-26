import { useDroppable } from '@dnd-kit/core'
import type { ComponentId } from '../types/components'
import { BREAKPOINT_WIDTH_PX } from '../lib/breakpoints'
import { getDefinition } from '../registry/registry'
import { useAppStore } from '../store/useAppStore'
import { layoutToStyle, normalizeLayout } from '../utils/componentLayout'
import { resolvePropsForBreakpoint } from '../utils/resolveBreakpointProps'
import { useCanvasViewport } from './CanvasViewportContext'

function NodeView({ id }: { id: ComponentId }) {
  const node = useAppStore((s) => s.components[id])
  const selectOne = useAppStore((s) => s.selectOne)
  const selectedIds = useAppStore((s) => s.selectedIds)
  const activeBreakpoint = useAppStore((s) => s.activeBreakpoint)

  if (!node) return null
  const def = getDefinition(node.type)
  const children = node.children.map((cid) => <NodeView key={cid} id={cid} />)
  const selected = selectedIds.includes(id)

  const resolvedProps = resolvePropsForBreakpoint(node, activeBreakpoint)
  const resolvedNode = { ...node, props: resolvedProps }

  const rendered = def?.render(resolvedNode, children) ?? (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3 text-sm">
      Unknown component: <code className="font-mono">{node.type}</code>
    </div>
  )

  const layoutStyle = layoutToStyle(normalizeLayout(resolvedProps.layout))

  return (
    <div
      className={[
        'rounded-[var(--radius-md)] outline-none ring-offset-2',
        selected ? 'ring-2 ring-[color:var(--color-primary)]' : 'hover:ring-1 hover:ring-black/10',
      ].join(' ')}
      style={layoutStyle}
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
  const activeBreakpoint = useAppStore((s) => s.activeBreakpoint)
  const canvasWidthPx = BREAKPOINT_WIDTH_PX[activeBreakpoint]

  const {
    viewportRef,
    zoom,
    pan,
    spaceHeld,
    isPanning,
    setContentMeasureRef,
    viewportHandlers,
  } = useCanvasViewport()

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas:root',
  })

  const setDropAndMeasureRef = (el: HTMLDivElement | null) => {
    setNodeRef(el)
    setContentMeasureRef(el)
  }

  ensureInitialized()

  const panCursor =
    spaceHeld || isPanning ? (isPanning ? 'grabbing' : 'grab') : 'default'

  return (
    <div
      ref={viewportRef}
      className="relative min-h-[min(640px,70vh)] overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-muted)]/10"
      style={{ cursor: panCursor, touchAction: 'none' }}
      {...viewportHandlers}
    >
      <div className="flex min-h-[inherit] justify-center p-4" onClick={() => selectOne(null)}>
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <div
            ref={setDropAndMeasureRef}
            data-canvas-artboard
            className={[
              'w-full max-w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-white p-2 shadow-sm transition-[width] duration-200',
              isOver ? 'bg-[color:var(--color-primary)]/5 ring-2 ring-[color:var(--color-primary)]/40' : '',
            ].join(' ')}
            style={{ width: canvasWidthPx, maxWidth: '100%' }}
            onClick={(e) => {
              e.stopPropagation()
              selectOne(null)
            }}
          >
            <NodeView id="root" />

            <div className="mt-3 text-xs text-[color:var(--color-muted)]">
              Tip: Drag from palette onto the canvas, or click “Add”. Scroll to zoom. Space+drag or middle mouse to
              pan.
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
        </div>
      </div>
    </div>
  )
}
