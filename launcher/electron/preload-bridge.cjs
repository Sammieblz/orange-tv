/**
 * Renderer bridge factory (no `electron` import) — unit-testable contract surface.
 * @see ipc-contract.cjs for approved channels.
 */
const { CHANNELS } = require("./ipc-contract.cjs");

/** @type {readonly string[]} Sorted for stable assertions in tests. */
const ORANGE_TV_BRIDGE_KEYS = Object.freeze([
  "closeWebShell",
  "focusShell",
  "getRuntimeMetadata",
  "launchRequest",
  "onShellForeground",
  "onWebShellState",
  "openWebShell",
  "ping",
  "setFullscreen",
]);

/**
 * @param {Pick<import("electron").IpcRenderer, "invoke" | "on" | "removeListener">} ipcRenderer
 * @param {typeof import("./shell-profile.cjs")} shellProfile
 */
function createOrangeTvBridge(ipcRenderer, shellProfile) {
  return {
    ping: () => ipcRenderer.invoke(CHANNELS.PING),

    launchRequest: (payload) => ipcRenderer.invoke(CHANNELS.LAUNCH_REQUEST, payload),

    getRuntimeMetadata: () => Promise.resolve(shellProfile.getRuntimeMetadataPayload()),

    onShellForeground: (callback) => {
      const channel = CHANNELS.SHELL_FOREGROUND;
      const listener = () => {
        callback();
      };
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },

    setFullscreen: (fullscreen) =>
      ipcRenderer.invoke(CHANNELS.WINDOW_SET_FULLSCREEN, { fullscreen }),

    focusShell: () => ipcRenderer.invoke(CHANNELS.SHELL_FOCUS),

    openWebShell: (payload) => ipcRenderer.invoke(CHANNELS.WEB_SHELL_OPEN, payload),

    closeWebShell: () => ipcRenderer.invoke(CHANNELS.WEB_SHELL_CLOSE),

    onWebShellState: (callback) => {
      const channel = CHANNELS.WEB_SHELL_STATE;
      const listener = (_event, state) => {
        callback(state);
      };
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },
  };
}

module.exports = {
  ORANGE_TV_BRIDGE_KEYS,
  createOrangeTvBridge,
};
