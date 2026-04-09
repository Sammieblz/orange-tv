import type { AppDto } from "@/api/types.ts";
import type { HomeScreenData } from "@/data/seedHome.ts";

function sessionHintForChromeTile(app: AppDto | undefined): string | undefined {
  if (!app || app.type?.toLowerCase() !== "chrome") {
    return undefined;
  }
  switch (app.sessionFreshness) {
    case "LikelyActive":
      return "Last session ended normally";
    case "PossiblyStale":
      return "May need sign-in";
    case "ResetSuggested":
      return "Sign-in may be required";
    default:
      return undefined;
  }
}

/** Overlays API session hints onto seed tiles when `tile.id` matches an `apps` row. */
export function mergeHomeScreenWithApps(
  home: HomeScreenData,
  apps: AppDto[] | undefined,
): HomeScreenData {
  if (!apps?.length) {
    return home;
  }

  const byId = new Map(apps.map((a) => [a.id, a]));
  return {
    ...home,
    rows: home.rows.map((row) => ({
      ...row,
      tiles: row.tiles.map((tile) => {
        const app = byId.get(tile.id);
        const sessionHint = sessionHintForChromeTile(app);
        if (!sessionHint) {
          return tile;
        }
        return { ...tile, sessionHint };
      }),
    })),
  };
}
