/* eslint-disable react-refresh/only-export-components -- module exports context provider and hook */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

import { MAX_CANVAS_ZOOM, MIN_CANVAS_ZOOM } from './canvasViewportConstants'

type Pan = { x: number; y: number }

function clampZoom(z: number): number {
  return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, z))
}

type CanvasViewportContextValue = {
  viewportRef: RefObject<HTMLDivElement | null>
  zoom: number
  pan: Pan
  spaceHeld: boolean
  isPanning: boolean
  zoomAtPoint: (clientX: number, clientY: number, nextZoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  fitToView: (contentWidth: number, contentHeight: number) => void
  fitToViewMeasured: () => void
  setContentMeasureRef: (el: HTMLDivElement | null) => void
  viewportHandlers: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void
    onPointerEnter: () => void
    onPointerLeave: () => void
  }
}

const CanvasViewportContext = createContext<CanvasViewportContextValue | null>(null)

export function CanvasViewportProvider({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentMeasureRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef(1)
  const panRef = useRef<Pan>({ x: 0, y: 0 })
  const spaceHeldRef = useRef(false)
  const mouseOverViewportRef = useRef(false)

  const [zoom, setZoomState] = useState(1)
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [isPanning, setIsPanning] = useState(false)

  const panSessionRef = useRef<{ startX: number; startY: number; origPan: Pan } | null>(null)

  useLayoutEffect(() => {
    zoomRef.current = zoom
    panRef.current = pan
  }, [zoom, pan])

  const zoomAtPoint = useCallback((clientX: number, clientY: number, nextZoom: number) => {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = clientX - rect.left
    const my = clientY - rect.top
    const prevZ = zoomRef.current
    const nz = clampZoom(nextZoom)
    if (Math.abs(nz - prevZ) < 1e-6) return
    const prevPan = panRef.current
    const nx = mx - ((mx - prevPan.x) / prevZ) * nz
    const ny = my - ((my - prevPan.y) / prevZ) * nz
    setPan({ x: nx, y: ny })
    setZoomState(nz)
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0015)
      zoomAtPoint(e.clientX, e.clientY, zoomRef.current * factor)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAtPoint])

  useEffect(() => {
    const typingTarget = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      if (typingTarget(e.target)) return
      if (!mouseOverViewportRef.current) return
      e.preventDefault()
      spaceHeldRef.current = true
      setSpaceHeld(true)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      spaceHeldRef.current = false
      setSpaceHeld(false)
      if (panSessionRef.current) {
        panSessionRef.current = null
        setIsPanning(false)
      }
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('keyup', onKeyUp, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('keyup', onKeyUp, { capture: true })
    }
  }, [])

  const zoomIn = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    zoomAtPoint(r.left + r.width / 2, r.top + r.height / 2, zoomRef.current * 1.1)
  }, [zoomAtPoint])

  const zoomOut = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    zoomAtPoint(r.left + r.width / 2, r.top + r.height / 2, zoomRef.current / 1.1)
  }, [zoomAtPoint])

  const fitToView = useCallback((contentWidth: number, contentHeight: number) => {
    const vp = viewportRef.current
    if (!vp || contentWidth <= 0 || contentHeight <= 0) return
    const vw = vp.clientWidth
    const vh = vp.clientHeight
    const fitZoom = Math.min(vw / contentWidth, vh / contentHeight, MAX_CANVAS_ZOOM)
    const z = Math.max(MIN_CANVAS_ZOOM, fitZoom)
    const panX = vw / 2 - (contentWidth / 2) * z
    const panY = vh / 2 - (contentHeight / 2) * z
    setPan({ x: panX, y: panY })
    setZoomState(z)
  }, [])

  const fitToViewMeasured = useCallback(() => {
    const el = contentMeasureRef.current
    if (!el) return
    fitToView(el.offsetWidth, el.offsetHeight)
  }, [fitToView])

  const setContentMeasureRef = useCallback((el: HTMLDivElement | null) => {
    contentMeasureRef.current = el
  }, [])

  const viewportHandlers = useMemo(
    () => ({
      onPointerEnter: () => {
        mouseOverViewportRef.current = true
      },
      onPointerLeave: () => {
        mouseOverViewportRef.current = false
      },
      onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
        const middlePan = e.button === 1
        const spacePrimaryPan = e.button === 0 && spaceHeldRef.current
        if (!middlePan && !spacePrimaryPan) return
        if (spacePrimaryPan) {
          const t = e.target as HTMLElement
          if (t.closest('[data-canvas-artboard]')) return
        }
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        panSessionRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          origPan: { ...panRef.current },
        }
        setIsPanning(true)
      },
      onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
        const sess = panSessionRef.current
        if (!sess) return
        e.preventDefault()
        const dx = e.clientX - sess.startX
        const dy = e.clientY - sess.startY
        setPan({ x: sess.origPan.x + dx, y: sess.origPan.y + dy })
      },
      onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
        if (panSessionRef.current) {
          try {
            e.currentTarget.releasePointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
        }
        panSessionRef.current = null
        setIsPanning(false)
      },
      onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => {
        if (panSessionRef.current) {
          try {
            e.currentTarget.releasePointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
        }
        panSessionRef.current = null
        setIsPanning(false)
      },
    }),
    [],
  )

  const value = useMemo(
    () => ({
      viewportRef,
      zoom,
      pan,
      spaceHeld,
      isPanning,
      zoomAtPoint,
      zoomIn,
      zoomOut,
      fitToView,
      fitToViewMeasured,
      setContentMeasureRef,
      viewportHandlers,
    }),
    [
      zoom,
      pan,
      spaceHeld,
      isPanning,
      zoomAtPoint,
      zoomIn,
      zoomOut,
      fitToView,
      fitToViewMeasured,
      setContentMeasureRef,
      viewportHandlers,
    ],
  )

  return <CanvasViewportContext.Provider value={value}>{children}</CanvasViewportContext.Provider>
}

export function useCanvasViewport(): CanvasViewportContextValue {
  const ctx = useContext(CanvasViewportContext)
  if (!ctx) throw new Error('useCanvasViewport must be used within CanvasViewportProvider')
  return ctx
}
