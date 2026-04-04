const { contextBridge, ipcRenderer } = require("electron");
const { CHANNELS } = require("./ipc-contract.cjs");
const shellProfile = require("./shell-profile.cjs");

contextBridge.exposeInMainWorld("orangeTv", {
  ping: () => ipcRenderer.invoke(CHANNELS.PING),

  launchRequest: (payload) => ipcRenderer.invoke(CHANNELS.LAUNCH_REQUEST, payload),

  /** Runtime metadata; minimal in appliance profile (no raw Node version). */
  getRuntimeMetadata: () => Promise.resolve(shellProfile.getRuntimeMetadataPayload()),
});
