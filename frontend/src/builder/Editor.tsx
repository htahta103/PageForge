import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { Canvas } from './Canvas'
import { Palette } from './Palette'
import { componentRegistry } from './registry'
import { DND_KIND, parseContainerDropId, parsePaletteDragId } from './dnd'
import { useEditorStore } from './store'

export function Editor() {
  const addFromPalette = useEditorStore((s) => s.addFromPalette)
  const [activeId, setActiveId] = useState<string | null>(null)

  const overlay = useMemo(() => {
    const type = activeId ? parsePaletteDragId(activeId) : null
    if (!type) return null
    const reg = componentRegistry[type]
    return (
      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm text-sm font-medium text-neutral-900">
        {reg.label}
      </div>
    )
  }, [activeId])

  return (
    <DndContext
      onDragStart={(evt) => setActiveId(String(evt.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={(evt) => {
        const active = String(evt.active.id)
        const type = parsePaletteDragId(active)
        if (!type) {
          setActiveId(null)
          return
        }

        const overId = evt.over?.id ? String(evt.over.id) : null
        if (!overId) {
          setActiveId(null)
          return
        }

        if (overId === DND_KIND.dropRoot) {
          addFromPalette(type, null)
          setActiveId(null)
          return
        }

        const containerId = parseContainerDropId(overId)
        if (containerId) addFromPalette(type, containerId)

        setActiveId(null)
      }}
    >
      <div className="h-screen flex">
        <Palette />
        <Canvas />
      </div>
      <DragOverlay>{overlay}</DragOverlay>
    </DndContext>
  )
}

