import * as client from "@/api/client.ts";
import { RunningAppsDock } from "@/components/RunningAppsDock/RunningAppsDock.tsx";
import { renderWithQueryClient, createTestQueryClient } from "@/test/queryTestUtils.tsx";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("RunningAppsDock", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("shows loading then empty when no sessions", async () => {
    let resolveFetch!: (r: Response) => void;
    const pending = new Promise<Response>((r) => {
      resolveFetch = r;
    });
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/v1/launch/sessions/active")) {
        return pending;
      }
      return Promise.resolve(new Response("nope", { status: 404 }));
    });

    const qc = createTestQueryClient();
    renderWithQueryClient(<RunningAppsDock />, qc);
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    resolveFetch!(Response.json({ items: [] }));
    await waitFor(() => {
      expect(screen.getByText("No external streaming sessions yet.")).toBeInTheDocument();
    });
    expect(screen.getByRole("note", { name: /Shell and platform notes/i })).toBeInTheDocument();
  });

  it("shows error when active sessions request fails", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("network down")));
    renderWithQueryClient(<RunningAppsDock />);
    await waitFor(
      () => {
        expect(screen.getByText("Could not load sessions.")).toBeInTheDocument();
      },
      { timeout: 4000 },
    );
  });

  it("renders session row and calls minimize API", async () => {
    const postSpy = vi.spyOn(client, "postLaunchSessionAction").mockResolvedValue({ ok: true });
    const focusShell = vi.fn().mockResolvedValue({ ok: true });
    (
      window as unknown as {
        orangeTv?: { focusShell: () => Promise<{ ok: boolean }> };
      }
    ).orangeTv = { focusShell };

    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/v1/launch/sessions/active")) {
        return Promise.resolve(
          Response.json({
            items: [
              {
                sessionId: "550e8400-e29b-41d4-a716-446655440000",
                appId: "netflix",
                label: "Netflix",
                pid: 42,
                startedAtUtc: "2026-01-01T00:00:00Z",
                kind: "chrome",
                mediaItemId: null,
              },
            ],
          }),
        );
      }
      return Promise.resolve(new Response("nope", { status: 404 }));
    });

    const user = userEvent.setup();
    renderWithQueryClient(<RunningAppsDock />);

    await waitFor(() => {
      expect(screen.getByText("Netflix")).toBeInTheDocument();
    });
    expect(screen.getByText(/chrome · PID 42/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Minimize" }));

    expect(postSpy).toHaveBeenCalledWith(
      "/api/v1/launch/sessions/550e8400-e29b-41d4-a716-446655440000/minimize",
    );
    await waitFor(() => {
      expect(focusShell).toHaveBeenCalled();
    });
  });
});
