export type LayoutMode = 'grid' | 'freeform'

export type CanvasItemId = string

export interface CanvasItem {
  id: CanvasItemId
  x: number // top-left, in canvas pixels
  y: number // top-left, in canvas pixels
  width: number
  height: number
  label: string
}

export interface Point {
  x: number
  y: number
}

