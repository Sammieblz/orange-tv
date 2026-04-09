import type { FocusActivatePayload } from "@/hooks/useFocusInputDispatch.ts";
import { useFocusStore } from "@/store/focusStore.ts";

/** Tile ids that map to seeded `apps` rows (`POST /api/v1/launch`). */
const LAUNCH_APP_TILE_IDS = new Set<string>(["launch-streaming-demo", "launch-mpv-demo"]);

const MEDIA_TILE_PREFIX = "media:";

export interface LaunchTileActivateOptions {
  /** Called after a successful IPC launch (e.g. refresh apps query). */
  onLaunchSucceeded?: () => void;
}

/**
 * When the user activates a launch tile, save focus for shell return and ask main to POST /api/v1/launch.
 */
export async function launchAppTileIfActivated(
  payload: FocusActivatePayload,
  options?: LaunchTileActivateOptions,
): Promise<void> {
  if (payload.context !== "tile") {
    return;
  }

  const isMediaTile = payload.id.startsWith(MEDIA_TILE_PREFIX);
  if (!isMediaTile && !LAUNCH_APP_TILE_IDS.has(payload.id)) {
    return;
  }

  useFocusStore.getState().requestShellFocusRestore();
  const launch = window.orangeTv?.launchRequest;
  if (!launch) {
    console.error("[launcher] launchRequest unavailable (not running under Electron preload)");
    return;
  }
  try {
    const result = isMediaTile
      ? await launch({
          kind: "media",
          mediaItemId: payload.id.slice(MEDIA_TILE_PREFIX.length),
        })
      : await launch({ kind: "app", id: payload.id });
    if (!result.ok) {
      console.error("[launcher] launch failed", result.reason ?? "(no reason)");
      return;
    }
    options?.onLaunchSucceeded?.();
  } catch (e) {
    console.error("[launcher] launch error", e);
  }
}
