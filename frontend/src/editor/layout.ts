import type { CanvasItem, LayoutMode, Point } from './types'

export const DEFAULT_GRID_SIZE_PX = 20

export function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) return value
  return Math.round(value / gridSize) * gridSize
}

export function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  }
}

export function snapItemToGrid(item: CanvasItem, gridSize: number): CanvasItem {
  return { ...item, x: snapToGrid(item.x, gridSize), y: snapToGrid(item.y, gridSize) }
}

export function snapItemsToGrid(items: CanvasItem[], gridSize: number): CanvasItem[] {
  return items.map((item) => snapItemToGrid(item, gridSize))
}

export function transitionItemsForMode({
  items,
  prevMode,
  nextMode,
  gridSize,
}: {
  items: CanvasItem[]
  prevMode: LayoutMode
  nextMode: LayoutMode
  gridSize: number
}): CanvasItem[] {
  if (prevMode === nextMode) return items
  if (nextMode === 'grid') return snapItemsToGrid(items, gridSize)
  // freeform mode preserves the current coordinates (best effort preservation).
  return items
}

export function applyDragDelta({
  start,
  delta,
  mode,
  gridSize,
}: {
  start: Point
  delta: Point
  mode: LayoutMode
  gridSize: number
}): Point {
  const raw = { x: start.x + delta.x, y: start.y + delta.y }
  return mode === 'grid' ? snapPointToGrid(raw, gridSize) : raw
}

