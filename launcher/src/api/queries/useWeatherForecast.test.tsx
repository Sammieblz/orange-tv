import { useWeatherForecast } from "@/api/queries/useWeatherForecast.ts";
import { queryWrapper, createTestQueryClient } from "@/test/queryTestUtils.tsx";
import { stubApiFetchSuccess } from "@/test/mockApiFetch.ts";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useWeatherForecast", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
    stubApiFetchSuccess();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("loads forecast data", async () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useWeatherForecast(), {
      wrapper: queryWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0]?.summary).toBe("Bracing");
  });
});
