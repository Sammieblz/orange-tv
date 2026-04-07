import { AppShell } from "@/components/AppShell/AppShell.tsx";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("AppShell", () => {
  it("renders sidebar, main content, and footer", () => {
    render(
      <AppShell sidebar={<aside data-testid="side">rail</aside>} footer={<footer>foot</footer>}>
        <div>body</div>
      </AppShell>,
    );
    expect(screen.getByTestId("side")).toHaveTextContent("rail");
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByText("foot")).toBeInTheDocument();
  });
});
