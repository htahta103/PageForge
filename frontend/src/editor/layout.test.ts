import { describe, expect, it } from 'vitest'
import type { CanvasItem } from './types'
import { applyDragDelta, DEFAULT_GRID_SIZE_PX, snapPointToGrid, snapToGrid, transitionItemsForMode } from './layout'

describe('layout snapping', () => {
  it('snapToGrid rounds to nearest grid line', () => {
    expect(snapToGrid(0, 20)).toBe(0)
    expect(snapToGrid(10, 20)).toBe(20)
    expect(snapToGrid(11, 20)).toBe(20)
    expect(snapToGrid(-11, 20)).toBe(-20)
  })

  it('snapPointToGrid snaps both axes', () => {
    expect(snapPointToGrid({ x: 21, y: 39 }, 20)).toEqual({ x: 20, y: 40 })
  })
})

describe('mode transitions', () => {
  it('freeform -> grid snaps items', () => {
    const items: CanvasItem[] = [{ id: 'x', x: 35, y: 19, width: 10, height: 10, label: 'X' }]
    const next = transitionItemsForMode({
      items,
      prevMode: 'freeform',
      nextMode: 'grid',
      gridSize: DEFAULT_GRID_SIZE_PX,
    })
    expect(next).toEqual([{ id: 'x', x: 40, y: 20, width: 10, height: 10, label: 'X' }])
  })

  it('grid -> freeform preserves snapped coordinates (best-effort)', () => {
    const items: CanvasItem[] = [{ id: 'x', x: 40, y: 20, width: 10, height: 10, label: 'X' }]
    const next = transitionItemsForMode({
      items,
      prevMode: 'grid',
      nextMode: 'freeform',
      gridSize: DEFAULT_GRID_SIZE_PX,
    })
    expect(next).toBe(items)
  })
})

describe('drag delta application', () => {
  it('grid mode snaps the drag delta result', () => {
    const next = applyDragDelta({
      start: { x: 35, y: 19 },
      delta: { x: 3, y: 2 },
      mode: 'grid',
      gridSize: 20,
    })
    // raw end = (38, 21) -> snapped end = (40, 20)
    expect(next).toEqual({ x: 40, y: 20 })
  })
})

