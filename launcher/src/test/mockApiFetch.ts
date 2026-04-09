import { vi } from "vitest";

/** Stubs `globalThis.fetch` for weather + platform endpoints used by the launcher. */
export function stubApiFetchSuccess() {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/weatherforecast")) {
      return Response.json([
        {
          date: "2025-01-01",
          temperatureC: 1,
          summary: "Bracing",
          temperatureF: 33,
        },
      ]);
    }
    if (url.includes("/api/v1/system/platform")) {
      return Response.json({
        osDescription: "Test OS",
        frameworkDescription: ".NET 9.0 test",
        isWindows: true,
        isLinux: false,
        preferredDirectorySeparator: "/",
        sampleNormalizedPath: "C:/Users/demo/file.txt",
      });
    }
    if (url.includes("/api/v1/watch/continue")) {
      return Response.json({ items: [] });
    }
    if (url.includes("/api/v1/recommendations/home")) {
      return Response.json({
        engine: "rules",
        mlRanker: "none",
        rankingRulesVersion: "rec-home-v1",
        continueRankingRulesVersion: "cw-v1",
        rows: [
          {
            rowId: "recent",
            title: "Recent",
            source: "rules",
            rankingRulesVersion: "rec-home-v1",
            items: [],
          },
          {
            rowId: "top-apps",
            title: "Top apps",
            source: "rules",
            rankingRulesVersion: "rec-home-v1",
            items: [],
          },
          {
            rowId: "picks",
            title: "Picks for you",
            source: "rules",
            rankingRulesVersion: "rec-home-v1",
            items: [],
          },
        ],
      });
    }
    if (url.includes("/api/v1/apps")) {
      const now = new Date().toISOString();
      return Response.json({
        items: [
          {
            id: "launch-streaming-demo",
            label: "Open streaming (Chrome)",
            type: "chrome",
            launchUrl: "https://example.com",
            sortOrder: 0,
            createdAtUtc: now,
            updatedAtUtc: now,
            chromeProfileSegment: null,
            sessionFreshness: "Unknown",
            lastSessionEndedAtUtc: null,
            lastSessionExitCode: null,
          },
          {
            id: "launch-mpv-demo",
            label: "Play sample (MPV)",
            type: "mpv",
            launchUrl: "",
            sortOrder: 1,
            createdAtUtc: now,
            updatedAtUtc: now,
            chromeProfileSegment: null,
            sessionFreshness: "Unknown",
            lastSessionEndedAtUtc: null,
            lastSessionExitCode: null,
          },
        ],
      });
    }
    return new Response("Not found", { status: 404 });
  });
}
