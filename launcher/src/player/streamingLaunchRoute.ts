/**
 * Pure routing decision for streaming tile activation (SAM-64).
 *
 * Given an app record and the web-shell feature flag, returns either:
 *   - `{ mode: "web-shell", url, appId, chromeProfileSegment }` for the in-window BrowserView path
 *   - `{ mode: "external", appId }` for the legacy `POST /api/v1/launch` → spawn Chrome path
 *
 * This module has no React, Electron, or fetch dependencies so it can be unit-tested
 * without jsdom. See `docs/player-and-streaming-strategy.md` → "Streaming shell".
 */

export interface StreamingLaunchInputApp {
  id: string;
  type: string | null;
  launchUrl: string | null;
  chromeProfileSegment: string | null;
}

export type StreamingLaunchRoute =
  | { mode: "web-shell"; url: string; appId: string; chromeProfileSegment: string | null }
  | { mode: "external"; appId: string };

/**
 * Decide how to launch a streaming tile. Rules (precedence top-down):
 *
 * 1. If `webShellEnabled` is **false** → always `external` (matches pre-SAM-61 behavior).
 * 2. If the app `type` is not `"chrome"` → `external` (MPV and other types keep using the API path).
 * 3. If the app has no usable `launchUrl` (missing or empty after trim) → `external`.
 * 4. Otherwise → `web-shell` with the `launchUrl` and the app's `chromeProfileSegment`.
 */
export function decideStreamingLaunchRoute(
  app: StreamingLaunchInputApp,
  webShellEnabled: boolean,
): StreamingLaunchRoute {
  if (!webShellEnabled) return { mode: "external", appId: app.id };

  const type = (app.type ?? "").toLowerCase();
  if (type !== "chrome") return { mode: "external", appId: app.id };

  const url = (app.launchUrl ?? "").trim();
  if (url.length === 0) return { mode: "external", appId: app.id };

  const segment =
    typeof app.chromeProfileSegment === "string" && app.chromeProfileSegment.trim().length > 0
      ? app.chromeProfileSegment.trim()
      : null;

  return { mode: "web-shell", url, appId: app.id, chromeProfileSegment: segment };
}
