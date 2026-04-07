const { contextBridge, ipcRenderer } = require("electron");
const shellProfile = require("./shell-profile.cjs");
const { createOrangeTvBridge } = require("./preload-bridge.cjs");

contextBridge.exposeInMainWorld("orangeTv", createOrangeTvBridge(ipcRenderer, shellProfile));
