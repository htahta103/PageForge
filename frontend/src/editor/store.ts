import { create } from 'zustand'
import type { CanvasItem, CanvasItemId, LayoutMode, Point } from './types'
import { DEFAULT_GRID_SIZE_PX, transitionItemsForMode } from './layout'

type EditorState = {
  layoutMode: LayoutMode
  gridSize: number
  items: CanvasItem[]
  setLayoutMode: (mode: LayoutMode) => void
  moveItemTo: (id: CanvasItemId, next: Point) => void
}

const initialItems: CanvasItem[] = [
  { id: 'a', x: 40, y: 60, width: 120, height: 60, label: 'Item A' },
  { id: 'b', x: 210, y: 140, width: 120, height: 60, label: 'Item B' },
]

export const useEditorStore = create<EditorState>((set, get) => ({
  layoutMode: 'freeform',
  gridSize: DEFAULT_GRID_SIZE_PX,
  items: initialItems,

  setLayoutMode: (mode) => {
    const prevMode = get().layoutMode
    if (prevMode === mode) return
    set({
      layoutMode: mode,
      items: transitionItemsForMode({
        items: get().items,
        prevMode,
        nextMode: mode,
        gridSize: get().gridSize,
      }),
    })
  },

  moveItemTo: (id, next) => {
    set({
      items: get().items.map((item) => (item.id === id ? { ...item, x: next.x, y: next.y } : item)),
    })
  },
}))

