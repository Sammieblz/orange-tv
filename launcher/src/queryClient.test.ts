import { queryClient } from "@/queryClient.ts";
import { describe, expect, it } from "vitest";

describe("queryClient", () => {
  it("uses expected default query options", () => {
    const q = queryClient.getDefaultOptions().queries;
    expect(q?.staleTime).toBe(30_000);
    expect(q?.refetchOnWindowFocus).toBe(false);
  });
});
