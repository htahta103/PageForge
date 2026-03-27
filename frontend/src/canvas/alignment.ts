import type { CanvasItem, CanvasItemId } from './store'

export type Rect = {
  x: number
  y: number
  w: number
  h: number
}

type AxisSnap = {
  snapped: boolean
  value: number
  guide?: Guide
}

export type Guide = { kind: 'v' | 'h'; at: number }

export type AlignmentResult = {
  x: number
  y: number
  guides: Guide[]
  snappedX: boolean
  snappedY: boolean
}

function candidatesFromRect(r: Rect) {
  const left = r.x
  const right = r.x + r.w
  const centerX = r.x + r.w / 2

  const top = r.y
  const bottom = r.y + r.h
  const centerY = r.y + r.h / 2

  return { left, right, centerX, top, bottom, centerY }
}

function bestSnapAxis(
  sourceValues: { left: number; right: number; center: number },
  targetValues: number[],
  threshold: number,
  guideKind: 'v' | 'h',
): AxisSnap {
  let best: AxisSnap = { snapped: false, value: 0 }
  let bestDistance = Number.POSITIVE_INFINITY

  for (const src of [sourceValues.left, sourceValues.center, sourceValues.right]) {
    for (const target of targetValues) {
      const d = Math.abs(src - target)
      if (d <= threshold && d < bestDistance) {
        bestDistance = d
        best = { snapped: true, value: target, guide: { kind: guideKind, at: target } }
      }
    }
  }

  return best
}

export function alignRectToOthers(args: {
  activeId: CanvasItemId
  proposed: Rect
  others: CanvasItem[]
  threshold: number
}): AlignmentResult {
  const { proposed } = args
  const src = candidatesFromRect(proposed)

  const targetX: number[] = []
  const targetY: number[] = []

  for (const it of args.others) {
    if (it.id === args.activeId) continue
    const c = candidatesFromRect({ x: it.x, y: it.y, w: it.w, h: it.h })
    targetX.push(c.left, c.centerX, c.right)
    targetY.push(c.top, c.centerY, c.bottom)
  }

  const xSnap = bestSnapAxis(
    { left: src.left, center: src.centerX, right: src.right },
    targetX,
    args.threshold,
    'v',
  )
  const ySnap = bestSnapAxis(
    { left: src.top, center: src.centerY, right: src.bottom },
    targetY,
    args.threshold,
    'h',
  )

  let x = proposed.x
  let y = proposed.y
  const guides: Guide[] = []

  if (xSnap.snapped && xSnap.guide) {
    // Prefer to move the rect so the closest of {left,center,right} hits xSnap.value.
    const dxLeft = xSnap.value - src.left
    const dxCenter = xSnap.value - src.centerX
    const dxRight = xSnap.value - src.right
    const dx = [dxLeft, dxCenter, dxRight].reduce((a, b) => (Math.abs(a) < Math.abs(b) ? a : b))
    x = x + dx
    guides.push(xSnap.guide)
  }

  if (ySnap.snapped && ySnap.guide) {
    const dyTop = ySnap.value - src.top
    const dyCenter = ySnap.value - src.centerY
    const dyBottom = ySnap.value - src.bottom
    const dy = [dyTop, dyCenter, dyBottom].reduce((a, b) => (Math.abs(a) < Math.abs(b) ? a : b))
    y = y + dy
    guides.push(ySnap.guide)
  }

  return { x, y, guides, snappedX: xSnap.snapped, snappedY: ySnap.snapped }
}

export function snapToGrid(pos: { x: number; y: number }, gridSize: number) {
  const snap = (v: number) => Math.round(v / gridSize) * gridSize
  return { x: snap(pos.x), y: snap(pos.y) }
}

