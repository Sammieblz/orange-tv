import type { HomeRecommendationsDto, RecommendationItemDto } from "@/api/types.ts";
import type { ApiSliceStatus } from "@/data/apiSliceStatus.ts";
import type { HomeScreenData, TileDescriptor } from "@/data/seedHome.ts";

const ROW_IDS = new Set(["recent", "top-apps", "picks"]);

const REC_ERROR_TILE: TileDescriptor = {
  id: "recommendations-api-error",
  title: "Recommendations unavailable (API offline or error)",
  disabled: true,
};

const REC_EMPTY_TILE: TileDescriptor = {
  id: "recommendations-empty",
  title: "Nothing to suggest yet",
  disabled: true,
};

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
  status: ApiSliceStatus,
): HomeScreenData {
  if (status === "pending") {
    return home;
  }

  if (status === "error") {
    return {
      ...home,
      rows: home.rows.map((row) =>
        ROW_IDS.has(row.id) ? { ...row, tiles: [REC_ERROR_TILE] } : row,
      ),
    };
  }

  if (!feed?.rows?.length) {
    return {
      ...home,
      rows: home.rows.map((row) =>
        ROW_IDS.has(row.id) ? { ...row, tiles: [REC_EMPTY_TILE] } : row,
      ),
    };
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
        return { ...row, tiles: [REC_EMPTY_TILE] };
      }

      return {
        ...row,
        title: rec.title,
        tiles: rec.items.length > 0 ? rec.items.map(itemToTile) : [REC_EMPTY_TILE],
      };
    }),
  };
}
