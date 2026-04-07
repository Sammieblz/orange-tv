import { ApiStatusBar } from "@/components/ApiStatusBar/ApiStatusBar.tsx";
import { stubApiFetchSuccess } from "@/test/mockApiFetch.ts";
import { renderWithQueryClient } from "@/test/queryTestUtils.tsx";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ApiStatusBar", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
    stubApiFetchSuccess();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("shows base URL and connected status when API responds", async () => {
    renderWithQueryClient(<ApiStatusBar />);
    await waitFor(() => {
      expect(screen.getByText("http://localhost:5144")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/API: connected/)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Forecast rows: 1/)).toBeInTheDocument();
    });
  });
});
