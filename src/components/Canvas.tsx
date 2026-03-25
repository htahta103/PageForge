import { useDroppable } from "@dnd-kit/core";
import type { CanvasComponent } from "../types/canvas";
import { CanvasItem } from "./CanvasItem";

interface CanvasProps {
  components: CanvasComponent[];
}

export function Canvas({ components }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  });

  return (
    <div
      ref={setNodeRef}
      className="canvas"
      style={{
        flex: 1,
        position: "relative",
        background: isOver ? "#f0f9ff" : "#f8fafc",
        backgroundImage:
          "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        overflow: "hidden",
        transition: "background-color 0.2s",
        border: isOver ? "2px dashed #3b82f6" : "2px dashed transparent",
      }}
    >
      {components.length === 0 && !isOver && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#94a3b8",
            fontSize: 16,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          Drag components here
        </div>
      )}
      {isOver && components.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#3b82f6",
            fontSize: 16,
            fontWeight: 500,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          Drop to add component
        </div>
      )}
      {components.map((component) => (
        <CanvasItem key={component.id} component={component} />
      ))}
    </div>
  );
}
