import { useContinueWatching } from "@/api/queries/useContinueWatching.ts";
import { queryWrapper, createTestQueryClient } from "@/test/queryTestUtils.tsx";
import { stubApiFetchSuccess } from "@/test/mockApiFetch.ts";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useContinueWatching", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
    stubApiFetchSuccess();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("loads continue list (empty from stub)", async () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useContinueWatching(), {
      wrapper: queryWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toEqual([]);
  });

  it("parses items when API returns entries", async () => {
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/v1/watch/continue")) {
        return Response.json({
          items: [
            {
              mediaItemId: "550e8400-e29b-41d4-a716-446655440000",
              title: "Clip",
              thumbnailRelativePath: null,
              progress: 0.33,
              lastPlayedAtUtc: "2026-03-01T12:00:00Z",
            },
          ],
        });
      }
      if (url.includes("/weatherforecast")) {
        return Response.json([]);
      }
      if (url.includes("/api/v1/system/platform")) {
        return Response.json({
          osDescription: "Test OS",
          frameworkDescription: ".NET",
          isWindows: true,
          isLinux: false,
          preferredDirectorySeparator: "/",
          sampleNormalizedPath: "x",
        });
      }
      if (url.includes("/api/v1/apps")) {
        return Response.json({ items: [] });
      }
      return new Response("Not found", { status: 404 });
    });

    const client = createTestQueryClient();
    const { result } = renderHook(() => useContinueWatching(), {
      wrapper: queryWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0]?.mediaItemId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.current.data?.items[0]?.progress).toBe(0.33);
  });
});
