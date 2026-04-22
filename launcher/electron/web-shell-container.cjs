/**
 * Pure logic for the in-shell BrowserView container (SAM-60) — the future "web-shell"
 * surface where streaming tiles (Netflix/Prime/Disney+) will render inside Orange TV
 * instead of spawning a separate Chrome window.
 *
 * This module does **not** import Electron; it produces plans that main.cjs will apply
 * with `BrowserWindow.setBrowserView` + `BrowserView.setBounds` when the feature lands.
 * Keeping the logic pure lets us cover geometry, URL allow-list, and key-forwarding
 * decisions with `node --test` before any Electron code exists.
 *
 * See `docs/player-and-streaming-strategy.md` → "Streaming shell".
 */

const ALLOWED_PROTOCOLS = Object.freeze(["https:"]);

/**
 * Build the container rectangle that fully overlays the shell window content area.
 * Matches the pattern used by the Hero/player overlay: edge-to-edge inside the
 * window workArea coordinate system.
 *
 * @param {{ width: number, height: number }} windowSize
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
function fullscreenBounds(windowSize) {
  const width = Number.isFinite(windowSize?.width) && windowSize.width > 0 ? windowSize.width : 0;
  const height = Number.isFinite(windowSize?.height) && windowSize.height > 0 ? windowSize.height : 0;
  return { x: 0, y: 0, width, height };
}

/**
 * Validate a URL before loading it into the web-shell. Only https:// is accepted; the
 * optional allowHosts list pins the container to known streaming hosts.
 *
 * @param {string} url
 * @param {readonly string[]} [allowHosts]
 * @returns {{ ok: true, url: string, host: string } | { ok: false, reason: string }}
 */
function validateWebShellUrl(url, allowHosts) {
  if (typeof url !== "string" || url.length === 0) {
    return { ok: false, reason: "invalid-url" };
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_e) {
    return { ok: false, reason: "invalid-url" };
  }
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { ok: false, reason: "protocol-not-allowed" };
  }
  if (Array.isArray(allowHosts) && allowHosts.length > 0) {
    const host = parsed.host.toLowerCase();
    const ok = allowHosts.some((allowed) => {
      const a = String(allowed).toLowerCase();
      return host === a || host.endsWith(`.${a}`);
    });
    if (!ok) {
      return { ok: false, reason: "host-not-allowed" };
    }
  }
  return { ok: true, url: parsed.toString(), host: parsed.host };
}

/**
 * Which keys the web-shell container should capture (handle in the shell) vs forward
 * to the embedded page. Aligns with `TV_CONTROLS_CONTRACT["web-shell"]` in the
 * launcher (`navigation/tvControlsContract.ts`); duplicated here intentionally so the
 * Electron main process does not need to import TypeScript.
 *
 * @param {string} key DOM key from `before-input-event`
 * @returns {"capture" | "forward" | "ignore"}
 */
function classifyWebShellKey(key) {
  if (typeof key !== "string" || key.length === 0) return "ignore";
  switch (key) {
    case "Escape":
    case "Backspace":
      return "capture";
    case "Home":
      return "capture";
    case "ContextMenu":
      return "capture";
    default:
      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "Enter" ||
        key === " " ||
        key.length === 1
      ) {
        return "forward";
      }
      return "ignore";
  }
}

module.exports = {
  fullscreenBounds,
  validateWebShellUrl,
  classifyWebShellKey,
};
