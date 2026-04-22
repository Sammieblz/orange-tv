import type { FocusActivatePayload } from "@/hooks/useFocusInputDispatch.ts";
import { getApiBaseUrl } from "@/api/client.ts";
import { useFocusStore } from "@/store/focusStore.ts";
import { useLaunchFeedbackStore } from "@/store/launchFeedbackStore.ts";

/** Tile ids that map to seeded `apps` rows (`POST /api/v1/launch`). */
const LAUNCH_APP_TILE_IDS = new Set<string>(["launch-streaming-demo", "launch-mpv-demo"]);

const MEDIA_TILE_PREFIX = "media:";
const APP_TILE_PREFIX = "app:";

export interface LaunchTileActivateOptions {
  /** Called after a successful IPC launch (e.g. refresh apps query). */
  onLaunchSucceeded?: () => void;
}

type LaunchResultDto = { ok: true; sessionId?: string; pid?: number } | { ok: false; reason?: string };

/**
 * POST launch endpoints return JSON even on 4xx/5xx (`{ ok, reason }`); parse the body instead of throwing.
 */
async function postLaunchJson(path: string, body: unknown): Promise<LaunchResultDto> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // ignore
  }
  const obj = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  if (!res.ok) {
    const reason =
      typeof obj.reason === "string"
        ? obj.reason
        : typeof obj.error === "string"
          ? obj.error
          : `http-${res.status}`;
    return { ok: false, reason };
  }
  if (obj.ok === false) {
    return { ok: false, reason: typeof obj.reason === "string" ? obj.reason : "launch-failed" };
  }
  return {
    ok: true,
    sessionId: typeof obj.sessionId === "string" ? obj.sessionId : undefined,
    pid: typeof obj.pid === "number" ? obj.pid : undefined,
  };
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
  const isPrefixedApp = payload.id.startsWith(APP_TILE_PREFIX);
  if (!isMediaTile && !isPrefixedApp && !LAUNCH_APP_TILE_IDS.has(payload.id)) {
    return;
  }

  useFocusStore.getState().requestShellFocusRestore();
  const launch = window.orangeTv?.launchRequest;
  const feedback = useLaunchFeedbackStore.getState().setOutcome;
  if (!launch) {
    if (!import.meta.env.DEV) {
      console.error("[launcher] launchRequest unavailable (not running under Electron preload)");
      feedback(false, "Electron bridge unavailable");
      return;
    }

    try {
      const result: LaunchResultDto = isMediaTile
        ? await postLaunchJson(`/api/v1/launch/media/${payload.id.slice(MEDIA_TILE_PREFIX.length)}`, {})
        : await postLaunchJson("/api/v1/launch", {
            appId: isPrefixedApp ? payload.id.slice(APP_TILE_PREFIX.length) : payload.id,
          });
      if (!result.ok) {
        console.error("[launcher] launch failed", result.reason ?? "(no reason)");
        useFocusStore.getState().clearFocusCheckpoint();
        feedback(false, result.reason);
        return;
      }
      feedback(true);
      options?.onLaunchSucceeded?.();
    } catch (e) {
      console.error("[launcher] launch error", e);
      useFocusStore.getState().clearFocusCheckpoint();
      feedback(false, e instanceof Error ? e.message : "network-error");
    }
    return;
  }
  try {
    const result = isMediaTile
      ? await launch({
          kind: "media",
          mediaItemId: payload.id.slice(MEDIA_TILE_PREFIX.length),
        })
      : await launch({
          kind: "app",
          id: isPrefixedApp ? payload.id.slice(APP_TILE_PREFIX.length) : payload.id,
        });
    if (!result.ok) {
      console.error("[launcher] launch failed", result.reason ?? "(no reason)");
      useFocusStore.getState().clearFocusCheckpoint();
      feedback(false, result.reason);
      return;
    }
    feedback(true);
    options?.onLaunchSucceeded?.();
  } catch (e) {
    console.error("[launcher] launch error", e);
    useFocusStore.getState().clearFocusCheckpoint();
    feedback(false, e instanceof Error ? e.message : "network-error");
  }
}
