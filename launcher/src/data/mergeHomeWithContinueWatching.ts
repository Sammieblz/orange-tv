import type { ContinueWatchingItemDto } from "@/api/types.ts";
import type { HomeScreenData } from "@/data/seedHome.ts";

const CONTINUE_ROW_ID = "continue";

/** Replaces the Continue watching row tiles with API data when `items` is defined (including empty). */
export function mergeHomeWithContinueWatching(
  home: HomeScreenData,
  items: ContinueWatchingItemDto[] | undefined,
): HomeScreenData {
  if (items === undefined) {
    return home;
  }

  return {
    ...home,
    rows: home.rows.map((row) =>
      row.id === CONTINUE_ROW_ID
        ? {
            ...row,
            tiles: items.map((it) => ({
              id: `media:${it.mediaItemId}`,
              title: it.title,
              progress: it.progress,
            })),
          }
        : row,
    ),
  };
}
