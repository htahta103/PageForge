import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the palette with component items", () => {
    render(<App />);
    expect(screen.getByText("Components")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByText("Button")).toBeInTheDocument();
    expect(screen.getByText("Container")).toBeInTheDocument();
  });

  it("renders the canvas with placeholder text", () => {
    render(<App />);
    const placeholders = screen.getAllByText("Drag components here");
    expect(placeholders.length).toBeGreaterThanOrEqual(1);
  });
});
