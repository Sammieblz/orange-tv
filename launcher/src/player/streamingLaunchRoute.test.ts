import { describe, expect, it } from "vitest";

import {
  decideStreamingLaunchRoute,
  type StreamingLaunchInputApp,
} from "@/player/streamingLaunchRoute.ts";

const netflix: StreamingLaunchInputApp = {
  id: "netflix",
  type: "chrome",
  launchUrl: "https://www.netflix.com/browse",
  chromeProfileSegment: null,
};

describe("decideStreamingLaunchRoute", () => {
  it("always returns external when the feature flag is off", () => {
    expect(decideStreamingLaunchRoute(netflix, false)).toEqual({
      mode: "external",
      appId: "netflix",
    });
  });

  it("returns web-shell for chrome-type apps with a url when flag is on", () => {
    expect(decideStreamingLaunchRoute(netflix, true)).toEqual({
      mode: "web-shell",
      appId: "netflix",
      url: "https://www.netflix.com/browse",
      chromeProfileSegment: null,
    });
  });

  it("preserves an explicit chromeProfileSegment for shared sign-in tiles", () => {
    const shared: StreamingLaunchInputApp = {
      ...netflix,
      chromeProfileSegment: "shared-streaming",
    };
    expect(decideStreamingLaunchRoute(shared, true)).toEqual({
      mode: "web-shell",
      appId: "netflix",
      url: "https://www.netflix.com/browse",
      chromeProfileSegment: "shared-streaming",
    });
  });

  it("trims whitespace-only segments down to null", () => {
    const r = decideStreamingLaunchRoute(
      { ...netflix, chromeProfileSegment: "   " },
      true,
    );
    expect(r).toMatchObject({ mode: "web-shell", chromeProfileSegment: null });
  });

  it("falls back to external when the app type is not 'chrome'", () => {
    const mpv: StreamingLaunchInputApp = { ...netflix, type: "mpv" };
    expect(decideStreamingLaunchRoute(mpv, true)).toEqual({
      mode: "external",
      appId: "netflix",
    });
  });

  it("falls back to external when type is null", () => {
    const typeless: StreamingLaunchInputApp = { ...netflix, type: null };
    expect(decideStreamingLaunchRoute(typeless, true).mode).toBe("external");
  });

  it("falls back to external when the launch URL is missing or empty", () => {
    expect(
      decideStreamingLaunchRoute({ ...netflix, launchUrl: null }, true).mode,
    ).toBe("external");
    expect(
      decideStreamingLaunchRoute({ ...netflix, launchUrl: "" }, true).mode,
    ).toBe("external");
    expect(
      decideStreamingLaunchRoute({ ...netflix, launchUrl: "   " }, true).mode,
    ).toBe("external");
  });

  it("is case-insensitive on app type", () => {
    const up: StreamingLaunchInputApp = { ...netflix, type: "Chrome" };
    expect(decideStreamingLaunchRoute(up, true).mode).toBe("web-shell");
  });
});
