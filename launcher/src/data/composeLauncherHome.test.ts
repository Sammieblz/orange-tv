import { composeLauncherHome } from "@/data/composeLauncherHome.ts";
import { describe, expect, it } from "vitest";

describe("composeLauncherHome", () => {
  it("chains continue, recommendations, and apps overlays", () => {
    const home = composeLauncherHome({
      continueItems: [],
      continueStatus: "success",
      recommendations: {
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
        ],
      },
      recommendationsStatus: "success",
      apps: [
        {
          id: "netflix",
          label: "Netflix",
          type: "chrome",
          launchUrl: "https://www.netflix.com",
          sortOrder: 100,
          createdAtUtc: "",
          updatedAtUtc: "",
          chromeProfileSegment: null,
          sessionFreshness: "Unknown",
          lastSessionEndedAtUtc: null,
          lastSessionExitCode: null,
        },
      ],
      appsStatus: "success",
    });

    expect(home.rows.find((r) => r.id === "continue")?.tiles).toEqual([]);
    const streaming = home.rows.find((r) => r.id === "streaming");
    expect(streaming?.tiles[0]).toMatchObject({ id: "app:netflix", title: "Netflix" });
  });
});
