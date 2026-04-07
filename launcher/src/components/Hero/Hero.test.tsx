import { Hero } from "@/components/Hero/Hero.tsx";
import { minimalHome } from "@/test/fixtures/homeScreen.ts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Hero", () => {
  const content = minimalHome().hero;

  it("renders title and subtitle", () => {
    render(<Hero content={content} focused={false} />);
    expect(screen.getByRole("heading", { level: 1, name: content.title })).toBeInTheDocument();
    expect(screen.getByText(content.subtitle)).toBeInTheDocument();
  });

  it("exposes featured region for a11y", () => {
    render(<Hero content={content} focused />);
    expect(screen.getByLabelText("Featured")).toBeInTheDocument();
  });
});
