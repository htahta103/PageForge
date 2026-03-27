import { MAX_CANVAS_ZOOM, MIN_CANVAS_ZOOM } from './canvasViewportConstants'
import { useCanvasViewport } from './CanvasViewportContext'

export function CanvasZoomToolbar() {
  const { zoom, zoomIn, zoomOut, fitToViewMeasured } = useCanvasViewport()
  const pct = Math.round(zoom * 100)
  const atMin = zoom <= MIN_CANVAS_ZOOM + 1e-4
  const atMax = zoom >= MAX_CANVAS_ZOOM - 1e-4

  return (
    <div
      aria-label="Canvas zoom"
      className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-2 py-1"
      role="toolbar"
    >
      <span className="hidden min-w-[3.25rem] text-center font-mono text-sm tabular-nums sm:inline">{pct}%</span>
      <div className="flex items-center gap-0.5">
        <button
          aria-label="Zoom out"
          className="rounded-md px-2.5 py-1.5 text-sm text-[color:var(--color-foreground)] hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={atMin}
          type="button"
          onClick={zoomOut}
        >
          −
        </button>
        <button
          aria-label="Zoom in"
          className="rounded-md px-2.5 py-1.5 text-sm text-[color:var(--color-foreground)] hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={atMax}
          type="button"
          onClick={zoomIn}
        >
          +
        </button>
      </div>
      <button
        className="rounded-md px-2.5 py-1.5 text-xs text-[color:var(--color-muted)] hover:bg-black/5 hover:text-[color:var(--color-foreground)]"
        type="button"
        onClick={fitToViewMeasured}
      >
        Fit
      </button>
      <span className="font-mono text-xs text-[color:var(--color-muted)] sm:hidden">{pct}%</span>
    </div>
  )
}
