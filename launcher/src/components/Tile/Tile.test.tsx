import { Tile } from "@/components/Tile/Tile.tsx";
import type { TileDescriptor } from "@/data/seedHome.ts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Tile", () => {
  it("renders caption and placeholder when no image", () => {
    const tile: TileDescriptor = { id: "t1", title: "Hello World" };
    render(<Tile tile={tile} focused={false} />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.getByText("He")).toBeInTheDocument();
  });

  it("marks disabled tiles", () => {
    const tile: TileDescriptor = { id: "x", title: "Off", disabled: true };
    render(<Tile tile={tile} focused />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });

  it("shows progress bar when progress between 0 and 1", () => {
    const tile: TileDescriptor = { id: "p", title: "P", progress: 0.5 };
    const { container } = render(<Tile tile={tile} focused={false} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("invokes onPointerActivate when clicked", async () => {
    const user = userEvent.setup();
    const onPointerActivate = vi.fn();
    const tile: TileDescriptor = { id: "click-me", title: "Click" };
    render(<Tile tile={tile} focused={false} onPointerActivate={onPointerActivate} />);
    await user.click(screen.getByRole("button", { name: "Click" }));
    expect(onPointerActivate).toHaveBeenCalledOnce();
  });
});
