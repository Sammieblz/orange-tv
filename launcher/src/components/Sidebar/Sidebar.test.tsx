import { Sidebar } from "@/components/Sidebar/Sidebar.tsx";
import { minimalHome } from "@/test/fixtures/homeScreen.ts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Sidebar", () => {
  const items = minimalHome().nav;

  it("renders nav labels and expanded state in sidebar section", () => {
    const { container } = render(
      <Sidebar items={items} section="sidebar" sidebarIndex={0} activeNavId="nav-a" />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    const nav = container.querySelector("nav");
    expect(nav).toHaveAttribute("data-expanded", "true");
  });

  it("marks active home when focus is on hero", () => {
    render(<Sidebar items={items} section="hero" sidebarIndex={0} activeNavId="nav-a" />);
    const nav = screen.getByLabelText("Main");
    expect(nav).toHaveAttribute("data-expanded", "false");
  });

  it("calls onSelectNav when a rail item is clicked", async () => {
    const user = userEvent.setup();
    const onSelectNav = vi.fn();
    render(
      <Sidebar
        items={items}
        section="hero"
        sidebarIndex={0}
        activeNavId="nav-a"
        onSelectNav={onSelectNav}
      />,
    );
    await user.click(screen.getByRole("button", { name: "B" }));
    expect(onSelectNav).toHaveBeenCalledWith("nav-b");
  });
});
