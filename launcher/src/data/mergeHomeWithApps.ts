import type { AppDto } from "@/api/types.ts";
import type { ApiSliceStatus } from "@/data/apiSliceStatus.ts";
import type { HomeScreenData } from "@/data/seedHome.ts";

const STREAMING_ROW_ID = "streaming";
const LOCAL_MEDIA_APP_ID = "local-media";
const DEMO_APP_IDS = new Set(["launch-streaming-demo", "launch-mpv-demo"]);

/** Chrome / MPV / unknown-type apps shown in the Streaming row (demos use the Launch demos row). */
function isStreamingCatalogApp(a: AppDto): boolean {
  if (DEMO_APP_IDS.has(a.id)) {
    return false;
  }
  if (a.id === LOCAL_MEDIA_APP_ID) {
    return false;
  }
  const t = a.type?.trim().toLowerCase() ?? "";
  if (t === "" || t === "chrome" || t === "mpv") {
    return true;
  }
  return false;
}

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

function appToStreamingTile(app: AppDto) {
  return {
    id: `app:${app.id}`,
    title: app.label,
    sessionHint: sessionHintForChromeTile(app),
  };
}

/**
 * Overlays backend `apps` data onto the home model.
 *
 * - Replaces the `streaming` row tiles with live Chrome apps as `app:{appId}` tiles (launchable via Electron IPC).
 * - Adds `sessionHint` onto any seed tile whose `tile.id` matches an `apps` row (legacy/demo tiles).
 */
export function mergeHomeScreenWithApps(
  home: HomeScreenData,
  apps: AppDto[] | undefined,
  status: ApiSliceStatus,
): HomeScreenData {
  if (status === "pending") {
    return home;
  }

  if (status === "error") {
    return {
      ...home,
      rows: home.rows.map((row) =>
        row.id === STREAMING_ROW_ID
          ? {
              ...row,
              tiles: [
                {
                  id: "streaming-api-error",
                  title: "Apps unavailable — start the API (see footer URL) or check VITE_ORANGETV_API_BASE_URL",
                  disabled: true,
                },
              ],
            }
          : row,
      ),
    };
  }

  const list = apps ?? [];

  if (list.length === 0) {
    return {
      ...home,
      rows: home.rows.map((row) =>
        row.id === STREAMING_ROW_ID
          ? {
              ...row,
              tiles: [
                {
                  id: "streaming-empty",
                  title: "No apps in catalog (empty response from API)",
                  disabled: true,
                },
              ],
            }
          : row,
      ),
    };
  }

  const byId = new Map(list.map((a) => [a.id, a]));
  return {
    ...home,
    rows: home.rows.map((row) => {
      if (row.id === STREAMING_ROW_ID) {
        const streamingApps = list.filter(isStreamingCatalogApp);
        return {
          ...row,
          tiles:
            streamingApps.length > 0
              ? streamingApps.map(appToStreamingTile)
              : [{ id: "streaming-empty", title: "No streaming apps in catalog", disabled: true }],
        };
      }

      return {
        ...row,
        tiles: row.tiles.map((tile) => {
          const app = byId.get(tile.id);
          const sessionHint = sessionHintForChromeTile(app);
          if (!sessionHint) {
            return tile;
          }
          return { ...tile, sessionHint };
        }),
      };
    }),
  };
}
