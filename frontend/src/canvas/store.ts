import { create } from 'zustand'
import { produce } from 'immer'

export type CanvasItemId = string

export type CanvasItem = {
  id: CanvasItemId
  x: number
  y: number
  w: number
  h: number
  label: string
}

export type CanvasSettings = {
  snapToGridEnabled: boolean
  gridSize: number
  alignmentEnabled: boolean
  alignmentThreshold: number
}

type CanvasState = {
  items: Record<CanvasItemId, CanvasItem>
  itemOrder: CanvasItemId[]
  settings: CanvasSettings

  setSettings: (patch: Partial<CanvasSettings>) => void
  setItemPosition: (id: CanvasItemId, pos: { x: number; y: number }) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  items: {
    header: { id: 'header', x: 96, y: 80, w: 360, h: 72, label: 'Header' },
    hero: { id: 'hero', x: 96, y: 192, w: 520, h: 160, label: 'Hero' },
    button: { id: 'button', x: 96, y: 384, w: 180, h: 56, label: 'Button' },
    card: { id: 'card', x: 320, y: 384, w: 260, h: 120, label: 'Card' },
  },
  itemOrder: ['header', 'hero', 'button', 'card'],
  settings: {
    snapToGridEnabled: true,
    gridSize: 8,
    alignmentEnabled: true,
    alignmentThreshold: 6,
  },
  setSettings: (patch) =>
    set(
      produce((draft: CanvasState) => {
        draft.settings = { ...draft.settings, ...patch }
      }),
    ),
  setItemPosition: (id, pos) =>
    set(
      produce((draft: CanvasState) => {
        const item = draft.items[id]
        if (!item) return
        item.x = pos.x
        item.y = pos.y
      }),
    ),
}))

