import { useActiveLaunchSessions } from "@/api/queries/useActiveLaunchSessions.ts";
import { queryWrapper, createTestQueryClient } from "@/test/queryTestUtils.tsx";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useActiveLaunchSessions", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
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
                pid: 999,
                startedAtUtc: "2026-01-01T00:00:00Z",
                kind: "chrome",
                mediaItemId: null,
              },
            ],
          }),
        );
      }
      return Promise.resolve(new Response("not found", { status: 404 }));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("loads active sessions", async () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useActiveLaunchSessions(), {
      wrapper: queryWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0]?.label).toBe("Netflix");
  });
});
