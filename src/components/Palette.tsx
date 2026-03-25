import { PALETTE_ITEMS } from "../types/canvas";
import { PaletteItem } from "./PaletteItem";

export function Palette() {
  return (
    <div
      className="palette"
      style={{
        width: 200,
        padding: 16,
        borderRight: "1px solid #e2e8f0",
        background: "#ffffff",
        overflowY: "auto",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: 14,
          fontWeight: 600,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Components
      </h3>
      {PALETTE_ITEMS.map((item) => (
        <PaletteItem key={item.type} type={item.type} label={item.label} />
      ))}
    </div>
  );
}
