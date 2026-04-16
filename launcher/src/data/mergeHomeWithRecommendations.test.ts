import type { HomeRecommendationsDto } from "@/api/types.ts";
import { mergeHomeWithRecommendations } from "@/data/mergeHomeWithRecommendations.ts";
import { SEED_HOME } from "@/data/seedHome.ts";
import { describe, expect, it } from "vitest";

describe("mergeHomeWithRecommendations", () => {
  it("leaves home unchanged when feed undefined and still pending", () => {
    expect(mergeHomeWithRecommendations(SEED_HOME, undefined, "pending")).toEqual(SEED_HOME);
  });

  it("replaces recommendation row tiles from API", () => {
    const feed: HomeRecommendationsDto = {
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
          items: [
            {
              kind: "media",
              mediaItemId: "550e8400-e29b-41d4-a716-446655440000",
              title: "Clip",
              label: null,
              thumbnailRelativePath: null,
              progress: null,
            },
          ],
        },
        {
          rowId: "top-apps",
          title: "Top apps",
          source: "rules",
          rankingRulesVersion: "rec-home-v1",
          items: [
            {
              kind: "app",
              mediaItemId: null,
              appId: "launch-streaming-demo",
              title: "Chrome",
              label: "Chrome",
              thumbnailRelativePath: null,
              progress: null,
            },
          ],
        },
        {
          rowId: "picks",
          title: "Picks for you",
          source: "rules",
          rankingRulesVersion: "rec-home-v1",
          items: [],
        },
      ],
    };

    const merged = mergeHomeWithRecommendations(SEED_HOME, feed, "success");
    const recent = merged.rows.find((r) => r.id === "recent");
    expect(recent?.tiles[0]).toMatchObject({
      id: "media:550e8400-e29b-41d4-a716-446655440000",
      title: "Clip",
    });
    const top = merged.rows.find((r) => r.id === "top-apps");
    expect(top?.tiles[0]).toMatchObject({
      id: "app:launch-streaming-demo",
      title: "Chrome",
    });
    expect(merged.rows.find((r) => r.id === "picks")?.tiles[0]).toMatchObject({
      id: "recommendations-empty",
      disabled: true,
    });
  });
});
