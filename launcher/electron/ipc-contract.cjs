/**
 * Approved IPC channels for renderer -> main (via preload only).
 * Do not expose generic invoke; keep this list explicit.
 */
const CHANNELS = {
  PING: "orange-tv:ping",
  LAUNCH_REQUEST: "orange-tv:launch-request",
  /** Main -> renderer push (not ipcMain.handle). */
  SHELL_FOREGROUND: "orange-tv:shell-foreground",
};

module.exports = { CHANNELS };
