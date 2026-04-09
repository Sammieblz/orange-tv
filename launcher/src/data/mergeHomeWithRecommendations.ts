import type { HomeRecommendationsDto, RecommendationItemDto } from "@/api/types.ts";
import type { HomeScreenData } from "@/data/seedHome.ts";

const ROW_IDS = new Set(["recent", "top-apps", "picks"]);

function itemToTile(item: RecommendationItemDto): TileDescriptor {
  if (item.kind === "media" && item.mediaItemId) {
    return {
      id: `media:${item.mediaItemId}`,
      title: item.title ?? "",
      progress: item.progress ?? undefined,
    };
  }

  if (item.kind === "app" && item.appId) {
    return {
      id: `app:${item.appId}`,
      title: item.label ?? item.title ?? item.appId,
    };
  }

  return { id: "rec-invalid", title: "?", disabled: true };
}

/** Overlays rules-based recommendation rows when the API feed is available. */
export function mergeHomeWithRecommendations(
  home: HomeScreenData,
  feed: HomeRecommendationsDto | undefined,
): HomeScreenData {
  if (!feed?.rows?.length) {
    return home;
  }

  const byId = new Map(feed.rows.map((r) => [r.rowId, r]));

  return {
    ...home,
    rows: home.rows.map((row) => {
      if (!ROW_IDS.has(row.id)) {
        return row;
      }

      const rec = byId.get(row.id);
      if (!rec) {
        return row;
      }

      return {
        ...row,
        title: rec.title,
        tiles: rec.items.length > 0 ? rec.items.map(itemToTile) : [],
      };
    }),
  };
}
