export interface Position {
  x: number;
  y: number;
}

export type ComponentType = "text" | "image" | "button" | "container";

export interface CanvasComponent {
  id: string;
  type: ComponentType;
  position: Position;
  props: Record<string, unknown>;
}

export interface PaletteItem {
  type: ComponentType;
  label: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "button", label: "Button" },
  { type: "container", label: "Container" },
];

export const DEFAULT_PROPS: Record<ComponentType, Record<string, unknown>> = {
  text: { content: "Edit text" },
  image: { src: "", alt: "Placeholder" },
  button: { label: "Click me" },
  container: { width: 200, height: 150 },
};
