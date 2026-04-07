import { ContentRow } from "@/components/ContentRow/ContentRow.tsx";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ContentRow", () => {
  it("sets aria-label with focused hint when isFocusedRow", () => {
    render(
      <ContentRow title="Continue" isFocusedRow>
        <div>t</div>
      </ContentRow>,
    );
    expect(screen.getByLabelText("Continue, focused row")).toBeInTheDocument();
  });

  it("uses plain title in aria-label when not focused", () => {
    render(
      <ContentRow title="Streaming">
        <div>t</div>
      </ContentRow>,
    );
    expect(screen.getByLabelText("Streaming")).toBeInTheDocument();
  });
});
