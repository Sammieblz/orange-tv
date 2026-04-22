/**
 * Pure validation for main-process IPC handlers (unit-testable without Electron).
 */

const GuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @param {unknown} payload
 * @returns {{ valid: false; reason: string } | { valid: true; kind: "app"; id: string } | { valid: true; kind: "media"; mediaItemId: string }}
 */
function validateLaunchPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, reason: "invalid-payload" };
  }
  const kind = /** @type {{ kind?: unknown; id?: unknown; mediaItemId?: unknown }} */ (payload).kind;
  if (kind === "app") {
    const id = /** @type {{ id?: unknown }} */ (payload).id;
    if (typeof id !== "string" || id.length === 0 || id.length > 256) {
      return { valid: false, reason: "invalid-id" };
    }
    return { valid: true, kind: "app", id };
  }
  if (kind === "media") {
    const mediaItemId = /** @type {{ mediaItemId?: unknown }} */ (payload).mediaItemId;
    if (typeof mediaItemId !== "string" || mediaItemId.length === 0 || mediaItemId.length > 64) {
      return { valid: false, reason: "invalid-media-id" };
    }
    if (!GuidLike.test(mediaItemId)) {
      return { valid: false, reason: "invalid-media-id" };
    }
    return { valid: true, kind: "media", mediaItemId };
  }
  return { valid: false, reason: "unsupported-kind" };
}

/**
 * @param {unknown} payload
 * @returns {{ valid: false; reason: string } | { valid: true; fullscreen: boolean }}
 */
function validateWindowFullscreenPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, reason: "invalid-payload" };
  }
  const fullscreen = /** @type {{ fullscreen?: unknown }} */ (payload).fullscreen;
  if (typeof fullscreen !== "boolean") {
    return { valid: false, reason: "invalid-payload" };
  }
  return { valid: true, fullscreen };
}

/**
 * @typedef {{ valid: false, reason: string } |
 *   { valid: true, url: string, appId: string, chromeProfileSegment: string | null }} WebShellOpenPayloadResult
 *
 * @param {unknown} payload
 * @returns {WebShellOpenPayloadResult}
 */
function validateWebShellOpenPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, reason: "invalid-payload" };
  }
  const p = /** @type {{ url?: unknown; appId?: unknown; chromeProfileSegment?: unknown }} */ (
    payload
  );
  if (typeof p.url !== "string" || p.url.length === 0 || p.url.length > 2048) {
    return { valid: false, reason: "invalid-url" };
  }
  if (typeof p.appId !== "string" || p.appId.length === 0 || p.appId.length > 256) {
    return { valid: false, reason: "invalid-appid" };
  }
  let segment = null;
  if (p.chromeProfileSegment !== undefined && p.chromeProfileSegment !== null) {
    if (typeof p.chromeProfileSegment !== "string" || p.chromeProfileSegment.length > 128) {
      return { valid: false, reason: "invalid-segment" };
    }
    segment = p.chromeProfileSegment;
  }
  return { valid: true, url: p.url, appId: p.appId, chromeProfileSegment: segment };
}

module.exports = {
  validateLaunchPayload,
  validateWindowFullscreenPayload,
  validateWebShellOpenPayload,
};
