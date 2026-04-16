import { fetchJson, getApiBaseUrl, postLaunchSessionAction } from "@/api/client.ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns default when env is unset or blank", () => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "");
    expect(getApiBaseUrl()).toBe("http://localhost:5144");
  });

  it("trims trailing slash from env", () => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://api.example/");
    expect(getApiBaseUrl()).toBe("http://api.example");
  });
});

describe("fetchJson", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("requests with leading slash on path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("/weatherforecast");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:5144/weatherforecast");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      }),
    );

    await expect(fetchJson("/x")).rejects.toThrow("Request failed 503");
  });

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [1, 2],
      }),
    );

    await expect(fetchJson<number[]>("/a")).resolves.toEqual([1, 2]);
  });
});

describe("postLaunchSessionAction", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORANGETV_API_BASE_URL", "http://localhost:5144");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns ok true on 200 with ok true", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }),
    );
    await expect(
      postLaunchSessionAction("/api/v1/launch/sessions/abc/minimize"),
    ).resolves.toEqual({ ok: true, reason: undefined });
  });

  it("returns ok false with reason on 200 with ok false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: false, reason: "no-main-window" }),
      }),
    );
    await expect(postLaunchSessionAction("/api/v1/x/minimize")).resolves.toEqual({
      ok: false,
      reason: "no-main-window",
    });
  });

  it("maps 501 to ok false and unsupported reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 501,
        json: async () => ({ ok: false, reason: "unsupported-platform" }),
      }),
    );
    await expect(postLaunchSessionAction("/api/v1/x/minimize")).resolves.toEqual({
      ok: false,
      reason: "unsupported-platform",
    });
  });

  it("uses default reason when 501 body omits reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 501,
        json: async () => ({}),
      }),
    );
    await expect(postLaunchSessionAction("/api/v1/x/minimize")).resolves.toEqual({
      ok: false,
      reason: "unsupported-platform",
    });
  });

  it("throws on non-ok non-501 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "session-not-found" }),
      }),
    );
    await expect(postLaunchSessionAction("/api/v1/x/minimize")).rejects.toThrow("Request failed 404");
  });
});
