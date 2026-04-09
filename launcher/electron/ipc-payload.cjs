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

module.exports = {
  validateLaunchPayload,
  validateWindowFullscreenPayload,
};
