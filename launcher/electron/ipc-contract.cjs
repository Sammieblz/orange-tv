/**
 * Approved IPC channels for renderer <-> main (preload bridge only).
 * - Renderer invokes: PING, LAUNCH_REQUEST, WINDOW_SET_FULLSCREEN, SHELL_FOCUS (see preload-bridge.cjs).
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
  /** Renderer -> main: bring the shell window to the foreground (after minimizing a child app). */
  SHELL_FOCUS: "orange-tv:shell-focus",
  /** Renderer -> main: open a streaming tile URL inside an in-window BrowserView (SAM-61). */
  WEB_SHELL_OPEN: "orange-tv:web-shell-open",
  /** Renderer -> main: close the active in-window BrowserView (Back/Escape or UI trigger). */
  WEB_SHELL_CLOSE: "orange-tv:web-shell-close",
  /** Main -> renderer push: notifies the launcher that the BrowserView opened or closed. */
  WEB_SHELL_STATE: "orange-tv:web-shell-state",
};

/** Channels the preload bridge uses with `ipcRenderer.invoke` (subset of CHANNELS). */
const RENDERER_INVOKE_CHANNELS = Object.freeze([
  CHANNELS.PING,
  CHANNELS.LAUNCH_REQUEST,
  CHANNELS.WINDOW_SET_FULLSCREEN,
  CHANNELS.SHELL_FOCUS,
  CHANNELS.WEB_SHELL_OPEN,
  CHANNELS.WEB_SHELL_CLOSE,
]);

module.exports = { CHANNELS, RENDERER_INVOKE_CHANNELS };
