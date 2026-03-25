import { useDraggable } from "@dnd-kit/core";
import type { CanvasComponent } from "../types/canvas";

interface CanvasItemProps {
  component: CanvasComponent;
}

const COMPONENT_RENDERERS: Record<
  string,
  (props: Record<string, unknown>) => React.ReactElement
> = {
  text: (props) => (
    <div style={{ padding: 8, minWidth: 100 }}>
      {(props.content as string) || "Text"}
    </div>
  ),
  image: (props) => (
    <div
      style={{
        width: 150,
        height: 100,
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: 12,
      }}
    >
      {(props.src as string) ? (
        <img
          src={props.src as string}
          alt={(props.alt as string) || ""}
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      ) : (
        "Image"
      )}
    </div>
  ),
  button: (props) => (
    <button
      style={{
        padding: "8px 16px",
        background: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: 4,
        cursor: "default",
        fontSize: 14,
      }}
    >
      {(props.label as string) || "Button"}
    </button>
  ),
  container: (props) => (
    <div
      style={{
        width: (props.width as number) || 200,
        height: (props.height as number) || 150,
        border: "2px dashed #cbd5e1",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: 12,
      }}
    >
      Container
    </div>
  ),
};

export function CanvasItem({ component }: CanvasItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: component.id,
      data: { source: "canvas", componentId: component.id },
    });

  const style: React.CSSProperties = {
    position: "absolute",
    left: component.position.x,
    top: component.position.y,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    border: "1px solid transparent",
    borderRadius: 4,
    cursor: "grab",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    background: "#ffffff",
    boxShadow: isDragging
      ? "0 4px 12px rgba(0,0,0,0.15)"
      : "0 1px 3px rgba(0,0,0,0.1)",
    transition: isDragging ? "none" : "box-shadow 0.2s",
  };

  const renderer = COMPONENT_RENDERERS[component.type];

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      {renderer ? renderer(component.props) : <div>Unknown</div>}
    </div>
  );
}
