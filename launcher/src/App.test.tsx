import { App } from "@/App.tsx";
import { SEED_HOME } from "@/data/seedHome.ts";
import { stubApiFetchSuccess } from "@/test/mockApiFetch.ts";
import { renderWithQueryClient } from "@/test/queryTestUtils.tsx";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useLauncherKeyboard.ts", () => ({
  useLauncherKeyboard: () => {},
}));
vi.mock("@/hooks/useLauncherGamepad.ts", () => ({
  useLauncherGamepad: () => {},
}));
vi.mock("@/hooks/useShellFocusRecovery.ts", () => ({
  useShellFocusRecovery: () => {},
}));

describe("App", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
    stubApiFetchSuccess();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renders launcher hero title", async () => {
    renderWithQueryClient(<App />);
    expect(screen.getByText(SEED_HOME.hero.title)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/API: connected/)).toBeInTheDocument();
    });
  });
});
