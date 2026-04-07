/**
 * Approved IPC channels for renderer <-> main (preload bridge only).
 * - Renderer invokes: PING, LAUNCH_REQUEST, WINDOW_SET_FULLSCREEN (see preload-bridge.cjs).
 * - Main pushes: SHELL_FOREGROUND (ipcMain.handle is not used for this channel).
 * Do not expose generic ipcRenderer.invoke from the renderer; keep this list explicit.
 */
const CHANNELS = {
  PING: "orange-tv:ping",
  LAUNCH_REQUEST: "orange-tv:launch-request",
  /** Main -> renderer push (not ipcMain.handle). */
  SHELL_FOREGROUND: "orange-tv:shell-foreground",
  /** Renderer -> main: window chrome only ({ fullscreen: boolean }). */
  WINDOW_SET_FULLSCREEN: "orange-tv:window-set-fullscreen",
};

/** Channels the preload bridge uses with `ipcRenderer.invoke` (subset of CHANNELS). */
const RENDERER_INVOKE_CHANNELS = Object.freeze([
  CHANNELS.PING,
  CHANNELS.LAUNCH_REQUEST,
  CHANNELS.WINDOW_SET_FULLSCREEN,
]);

module.exports = { CHANNELS, RENDERER_INVOKE_CHANNELS };
