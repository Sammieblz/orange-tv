/**
 * Pure validation for main-process IPC handlers (unit-testable without Electron).
 */

/**
 * @param {unknown} payload
 * @returns {{ valid: false; reason: string } | { valid: true; kind: "app"; id: string }}
 */
function validateLaunchPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, reason: "invalid-payload" };
  }
  const kind = /** @type {{ kind?: unknown; id?: unknown }} */ (payload).kind;
  if (kind !== "app") {
    return { valid: false, reason: "unsupported-kind" };
  }
  const id = /** @type {{ kind?: unknown; id?: unknown }} */ (payload).id;
  if (typeof id !== "string" || id.length === 0 || id.length > 256) {
    return { valid: false, reason: "invalid-id" };
  }
  return { valid: true, kind: "app", id };
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
