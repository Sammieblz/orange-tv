/**
 * Pure logic for whether WINDOW_SET_FULLSCREEN should be rejected when the shell is kiosk-locked.
 * Kept separate from main.cjs for unit tests without Electron.
 *
 * @param {boolean} kioskLocked from shellProfile.isKioskLockedShell()
 * @param {boolean} requestedFullscreen desired fullscreen state from renderer
 * @returns {{ blocked: false } | { blocked: true, reason: string }}
 */
function resolveWindowSetFullscreenWhenKioskLocked(kioskLocked, requestedFullscreen) {
  if (kioskLocked && requestedFullscreen === false) {
    return { blocked: true, reason: "kiosk-fullscreen-locked" };
  }
  return { blocked: false };
}

module.exports = { resolveWindowSetFullscreenWhenKioskLocked };
