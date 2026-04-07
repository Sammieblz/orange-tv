import { usePlatformStatus } from "@/api/queries/usePlatformStatus.ts";
import { queryWrapper, createTestQueryClient } from "@/test/queryTestUtils.tsx";
import { stubApiFetchSuccess } from "@/test/mockApiFetch.ts";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("usePlatformStatus", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
    stubApiFetchSuccess();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("loads platform data", async () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => usePlatformStatus(), {
      wrapper: queryWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.osDescription).toBe("Test OS");
  });
});
