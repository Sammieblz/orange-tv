const { contextBridge, ipcRenderer } = require("electron");
const { CHANNELS } = require("./ipc-contract.cjs");
const shellProfile = require("./shell-profile.cjs");

contextBridge.exposeInMainWorld("orangeTv", {
  ping: () => ipcRenderer.invoke(CHANNELS.PING),

  launchRequest: (payload) => ipcRenderer.invoke(CHANNELS.LAUNCH_REQUEST, payload),

  /** Runtime metadata; minimal in appliance profile (no raw Node version). */
  getRuntimeMetadata: () => Promise.resolve(shellProfile.getRuntimeMetadataPayload()),

  /**
   * Subscribe to main-window focus after a prior blur (return from external app / Alt-Tab).
   * @returns Unsubscribe function.
   */
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

  /** Window chrome only: request fullscreen on the main BrowserWindow. */
  setFullscreen: (fullscreen) => ipcRenderer.invoke(CHANNELS.WINDOW_SET_FULLSCREEN, { fullscreen }),
});
