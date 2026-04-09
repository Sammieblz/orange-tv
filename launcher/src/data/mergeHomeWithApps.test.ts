import { mergeHomeScreenWithApps } from "@/data/mergeHomeWithApps.ts";
import { SEED_HOME } from "@/data/seedHome.ts";
import type { AppDto } from "@/api/types.ts";
import { describe, expect, it } from "vitest";

describe("mergeHomeScreenWithApps", () => {
  it("adds session hint for chrome apps with PossiblyStale", () => {
    const apps: AppDto[] = [
      {
        id: "launch-streaming-demo",
        label: "x",
        type: "chrome",
        launchUrl: null,
        sortOrder: 0,
        createdAtUtc: "",
        updatedAtUtc: "",
        chromeProfileSegment: null,
        sessionFreshness: "PossiblyStale",
        lastSessionEndedAtUtc: null,
        lastSessionExitCode: null,
      },
    ];
    const merged = mergeHomeScreenWithApps(SEED_HOME, apps);
    const row = merged.rows.find((r) => r.tiles.some((t) => t.id === "launch-streaming-demo"));
    const tile = row?.tiles.find((t) => t.id === "launch-streaming-demo");
    expect(tile?.sessionHint).toBe("May need sign-in");
  });

  it("leaves tiles unchanged when apps missing", () => {
    expect(mergeHomeScreenWithApps(SEED_HOME, undefined)).toEqual(SEED_HOME);
  });
});
