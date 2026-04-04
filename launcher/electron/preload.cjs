const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("orangeTv", {
  ping: () => ipcRenderer.invoke("orange-tv:ping"),
  /** Stub until Electron forwards launch intent to the local host service. */
  launchRequest: (payload) => {
    console.warn("[orangeTv preload] launchRequest stub", payload);
    return Promise.resolve({ ok: false, reason: "not-implemented" });
  },
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
