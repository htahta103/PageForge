import { useCallback, useEffect, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { ComponentId } from '../types/components'
import { BREAKPOINT_WIDTH_PX } from '../lib/breakpoints'
import { getDefinition } from '../registry/registry'
import { ROOT_ID } from '../lib/tree'
import { isNodeLocked, isNodeVisible, useAppStore } from '../store/useAppStore'
import { layoutToStyle, normalizeLayout } from '../utils/componentLayout'
import { resolvePropsForBreakpoint } from '../utils/resolveBreakpointProps'
import { normalizeSurface, surfaceToStyle } from '../utils/componentSurface'
import { useCanvasViewport } from './CanvasViewportContext'

function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el?.closest) return false
  return Boolean(el.closest('input, textarea, select, button, a[href], [contenteditable="true"]'))
}

function nearestComponentId(el: HTMLElement | null, stopAt: HTMLElement | null): ComponentId | null {
  let cur: HTMLElement | null = el
  while (cur && cur !== stopAt) {
    const id = cur.dataset.componentId
    if (id) return id
    cur = cur.parentElement
  }
  return null
}

function normalizeRect(x1: number, y1: number, x2: number, y2: number) {
  const left = Math.min(x1, x2)
  const top = Math.min(y1, y2)
  const width = Math.abs(x2 - x1)
  const height = Math.abs(y2 - y1)
  return { left, top, width, height }
}

function intersects(a: DOMRect, b: { left: number; top: number; width: number; height: number }) {
  return (
    a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top
  )
}

function NodeView({ id }: { id: ComponentId }) {
  const node = useAppStore((s) => s.components[id])
  const selectOne = useAppStore((s) => s.selectOne)
  const toggleInSelection = useAppStore((s) => s.toggleInSelection)
  const selectedIds = useAppStore((s) => s.selectedIds)
  const nudgeSelectedLayout = useAppStore((s) => s.nudgeSelectedLayout)
  const activeBreakpoint = useAppStore((s) => s.activeBreakpoint)

  const dragRef = useRef<{ lastX: number; lastY: number; active: boolean } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || id === ROOT_ID) return
      if (!node || isNodeLocked(node)) return
      if (!selectedIds.includes(id)) return
      if (isEditableTarget(e.target)) return
      dragRef.current = { lastX: e.clientX, lastY: e.clientY, active: false }
    },
    [id, node, selectedIds],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.lastX
      const dy = e.clientY - d.lastY
      if (!d.active) {
        if (dx * dx + dy * dy < 16) return
        d.active = true
      }
      d.lastX = e.clientX
      d.lastY = e.clientY
      nudgeSelectedLayout(dx, dy)
    }
    const onUp = () => {
      dragRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [nudgeSelectedLayout])

  if (!node) return null
  const onCanvas = id === ROOT_ID || isNodeVisible(node)
  if (!onCanvas) return null

  const def = getDefinition(node.type)
  const children = node.children.map((cid) => <NodeView key={cid} id={cid} />)
  const selected = selectedIds.includes(id)
  const locked = isNodeLocked(node)

  const resolvedProps = resolvePropsForBreakpoint(node, activeBreakpoint)
  const resolvedNode = { ...node, props: resolvedProps }

  const rendered = def?.render(resolvedNode, children) ?? (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3 text-sm">
      Unknown component: <code className="font-mono">{node.type}</code>
    </div>
  )

  const layoutStyle = layoutToStyle(normalizeLayout(resolvedProps.layout))
  const surfaceStyle = surfaceToStyle(normalizeSurface(resolvedProps.surface))

  return (
    <div
      className={[
        'relative rounded-[var(--radius-md)] outline-none ring-offset-2',
        selected ? 'ring-2 ring-[color:var(--color-primary)]' : 'hover:ring-1 hover:ring-black/10',
        locked ? 'cursor-not-allowed' : '',
      ].join(' ')}
      style={{ ...layoutStyle, ...surfaceStyle }}
      data-component-id={id}
      role="button"
      tabIndex={locked ? -1 : 0}
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation()
        if (locked) return
        if (id === ROOT_ID) {
          useAppStore.getState().selectOne(null)
          return
        }
        if (e.shiftKey) toggleInSelection(id)
        else selectOne(id)
      }}
      onKeyDown={(e) => {
        if (locked) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (id === ROOT_ID) useAppStore.getState().selectOne(null)
          else if (e.shiftKey) toggleInSelection(id)
          else selectOne(id)
        }
      }}
    >
      {rendered}
    </div>
  )
}

type MarqueeSession = {
  pointerId: number
  originX: number
  originY: number
  additive: boolean
  dragged: boolean
}

export function Canvas() {
  const ensureInitialized = useAppStore((s) => s.ensureInitialized)
  const addComponent = useAppStore((s) => s.addComponent)
  const selectOne = useAppStore((s) => s.selectOne)
  const select = useAppStore((s) => s.select)
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

  const innerRef = useRef<HTMLDivElement | null>(null)
  const sessionRef = useRef<MarqueeSession | null>(null)
  const liveRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null)
  const ateNextClickRef = useRef(false)
  const [marqueeBox, setMarqueeBox] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas:root',
  })

  const setInnerRef = useCallback(
    (el: HTMLDivElement | null) => {
      innerRef.current = el
      setNodeRef(el)
      setContentMeasureRef(el)
    },
    [setNodeRef, setContentMeasureRef],
  )

  ensureInitialized()

  const panCursor =
    spaceHeld || isPanning ? (isPanning ? 'grabbing' : 'grab') : 'default'

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const sess = sessionRef.current
      const rootEl = innerRef.current
      if (!sess || !rootEl || e.pointerId !== sess.pointerId) return

      const dx = e.clientX - sess.originX
      const dy = e.clientY - sess.originY
      if (dx * dx + dy * dy >= 16) sess.dragged = true

      const r = rootEl.getBoundingClientRect()
      const x1 = sess.originX - r.left
      const y1 = sess.originY - r.top
      const x2 = e.clientX - r.left
      const y2 = e.clientY - r.top
      const box = normalizeRect(x1, y1, x2, y2)
      liveRectRef.current = box
      if (box.width > 1 && box.height > 1) setMarqueeBox(box)
      else setMarqueeBox(null)
    }

    const onUp = (e: PointerEvent) => {
      const sess = sessionRef.current
      const rootEl = innerRef.current
      if (!sess || e.pointerId !== sess.pointerId) return
      sessionRef.current = null
      setMarqueeBox(null)
      const box = liveRectRef.current
      liveRectRef.current = null

      if (!sess.dragged || !rootEl || !box || box.width < 2 || box.height < 2) return

      ateNextClickRef.current = true
      const r = rootEl.getBoundingClientRect()
      const hitIds: ComponentId[] = []
      const nodes = rootEl.querySelectorAll<HTMLElement>('[data-component-id]')
      nodes.forEach((el) => {
        const cid = el.dataset.componentId
        if (!cid || cid === ROOT_ID) return
        const er = el.getBoundingClientRect()
        const rel = new DOMRect(er.left - r.left, er.top - r.top, er.width, er.height)
        if (intersects(rel, box)) hitIds.push(cid)
      })

      const uniq = [...new Set(hitIds)]
      if (!uniq.length) {
        if (!sess.additive) selectOne(null)
        return
      }
      if (sess.additive) {
        const cur = useAppStore.getState().selectedIds
        select([...new Set([...cur, ...uniq])])
      } else {
        select(uniq)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [select, selectOne])

  const onInnerPointerDownCapture = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const rootEl = innerRef.current
    if (!rootEl) return
    const t = e.target as HTMLElement
    if (t.closest('button, a[href], input, textarea, select')) return
    const hitId = nearestComponentId(t, rootEl)
    if (hitId && hitId !== ROOT_ID) return

    sessionRef.current = {
      pointerId: e.pointerId,
      originX: e.clientX,
      originY: e.clientY,
      additive: e.shiftKey,
      dragged: false,
    }
    liveRectRef.current = null
  }

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
            ref={setInnerRef}
            data-canvas-artboard
            className={[
              'relative w-full max-w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-white p-2 shadow-sm transition-[width] duration-200',
              isOver ? 'bg-[color:var(--color-primary)]/5 ring-2 ring-[color:var(--color-primary)]/40' : '',
            ].join(' ')}
            style={{ width: canvasWidthPx, maxWidth: '100%' }}
            onPointerDownCapture={onInnerPointerDownCapture}
            onClick={(e) => {
              e.stopPropagation()
              if (ateNextClickRef.current) {
                ateNextClickRef.current = false
                return
              }
              selectOne(null)
            }}
          >
            <NodeView id={ROOT_ID} />

            {marqueeBox ? (
              <div
                className="pointer-events-none absolute z-50 border border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10"
                style={{
                  left: marqueeBox.left,
                  top: marqueeBox.top,
                  width: marqueeBox.width,
                  height: marqueeBox.height,
                }}
              />
            ) : null}

            <div className="mt-3 text-xs text-[color:var(--color-muted)]">
              Tip: Shift+click toggles selection; drag on empty canvas to box-select; drag selected nodes to nudge;
              scroll to zoom; space+drag pans. Delete removes selection.
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
