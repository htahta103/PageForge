import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Palette } from "./components/Palette";
import { Canvas } from "./components/Canvas";
import type { CanvasComponent, ComponentType } from "./types/canvas";
import { DEFAULT_PROPS, PALETTE_ITEMS } from "./types/canvas";

let nextId = 1;

function generateId(): string {
  return `component-${nextId++}`;
}

export function App() {
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [activeType, setActiveType] = useState<ComponentType | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data?.source === "palette") {
      setActiveType(data.type as ComponentType);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveType(null);
      const { active, over } = event;
      if (!over || over.id !== "canvas") return;

      const data = active.data.current;

      if (data?.source === "palette") {
        // Adding a new component from the palette
        const type = data.type as ComponentType;
        const canvasEl = canvasRef.current;
        let dropX = 100;
        let dropY = 100;

        if (canvasEl && over.rect) {
          // Calculate drop position relative to canvas
          const canvasRect = canvasEl.getBoundingClientRect();
          const overRect = over.rect;
          // Use the center of the droppable area as a fallback
          dropX = overRect.width / 2 - canvasRect.left + canvasRect.left;
          dropY = overRect.height / 2 - canvasRect.top + canvasRect.top;

          // If we have the pointer position from the event, use it
          if (event.activatorEvent instanceof PointerEvent) {
            const pointerEvent = event.activatorEvent;
            dropX = pointerEvent.clientX - canvasRect.left + (event.delta.x || 0);
            dropY = pointerEvent.clientY - canvasRect.top + (event.delta.y || 0);
          }

          // Clamp to canvas bounds
          dropX = Math.max(0, Math.min(dropX, canvasRect.width - 50));
          dropY = Math.max(0, Math.min(dropY, canvasRect.height - 50));
        }

        const newComponent: CanvasComponent = {
          id: generateId(),
          type,
          position: { x: dropX, y: dropY },
          props: { ...DEFAULT_PROPS[type] },
        };
        setComponents((prev) => [...prev, newComponent]);
      } else if (data?.source === "canvas") {
        // Repositioning an existing component
        const componentId = data.componentId as string;
        const delta = event.delta;
        setComponents((prev) =>
          prev.map((comp) =>
            comp.id === componentId
              ? {
                  ...comp,
                  position: {
                    x: Math.max(0, comp.position.x + delta.x),
                    y: Math.max(0, comp.position.y + delta.y),
                  },
                }
              : comp
          )
        );
      }
    },
    []
  );

  const paletteItem = activeType
    ? PALETTE_ITEMS.find((p) => p.type === activeType)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: "flex",
          height: "100vh",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <Palette />
        <div ref={canvasRef} style={{ flex: 1, display: "flex" }}>
          <Canvas components={components} />
        </div>
      </div>
      <DragOverlay>
        {activeType && paletteItem ? (
          <div
            style={{
              padding: "12px 16px",
              background: "#e0e7ff",
              border: "1px solid #818cf8",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              color: "#334155",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {paletteItem.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
