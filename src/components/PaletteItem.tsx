import { useDraggable } from "@dnd-kit/core";
import type { ComponentType } from "../types/canvas";

interface PaletteItemProps {
  type: ComponentType;
  label: string;
}

export function PaletteItem({ type, label }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: "palette", type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="palette-item"
      style={{
        padding: "12px 16px",
        marginBottom: 8,
        background: isDragging ? "#e0e7ff" : "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 6,
        cursor: "grab",
        userSelect: "none",
        opacity: isDragging ? 0.5 : 1,
        fontSize: 14,
        fontWeight: 500,
        color: "#334155",
      }}
    >
      {label}
    </div>
  );
}
