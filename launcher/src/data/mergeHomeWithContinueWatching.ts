import type { ContinueWatchingItemDto } from "@/api/types.ts";
import type { ApiSliceStatus } from "@/data/apiSliceStatus.ts";
import type { HomeScreenData } from "@/data/seedHome.ts";

const CONTINUE_ROW_ID = "continue";

/** Replaces the Continue watching row from API status + items. */
export function mergeHomeWithContinueWatching(
  home: HomeScreenData,
  items: ContinueWatchingItemDto[] | undefined,
  status: ApiSliceStatus,
): HomeScreenData {
  if (status === "pending") {
    return home;
  }

  if (status === "error") {
    return {
      ...home,
      rows: home.rows.map((row) =>
        row.id === CONTINUE_ROW_ID
          ? {
              ...row,
              tiles: [
                {
                  id: "continue-api-error",
                  title: "Continue watching unavailable (API offline or error)",
                  disabled: true,
                },
              ],
            }
          : row,
      ),
    };
  }

  const list = items ?? [];

  return {
    ...home,
    rows: home.rows.map((row) =>
      row.id === CONTINUE_ROW_ID
        ? {
            ...row,
            tiles: list.map((it) => ({
              id: `media:${it.mediaItemId}`,
              title: it.title,
              progress: it.progress,
            })),
          }
        : row,
    ),
  };
}
