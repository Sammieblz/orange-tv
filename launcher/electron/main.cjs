const { app, BrowserWindow, ipcMain, screen, dialog, globalShortcut } = require("electron");
const path = require("path");
const shellLogger = require("./shell-logger.cjs");
const { CHANNELS } = require("./ipc-contract.cjs");
const shellProfile = require("./shell-profile.cjs");
const { createMainWindow } = require("./window-lifecycle.cjs");
const {
  validateLaunchPayload,
  validateWindowFullscreenPayload,
} = require("./ipc-payload.cjs");

shellLogger.installMainProcessHandlers();

const isDev = shellProfile.isDevElectron();

/** @type {import("electron").BrowserWindow | null} */
let mainWindow = null;
let disposeWindowExtras = () => {};

function registerIpcHandlers() {
  ipcMain.handle(CHANNELS.PING, () => "pong");

  ipcMain.handle(CHANNELS.LAUNCH_REQUEST, (_event, payload) => {
    const parsed = validateLaunchPayload(payload);
    if (!parsed.valid) {
      shellLogger.warn("launchRequest rejected", { reason: parsed.reason, payload });
      return Promise.resolve({ ok: false, reason: parsed.reason });
    }
    shellLogger.info("launchRequest accepted (stub)", { kind: parsed.kind, id: parsed.id });
    return Promise.resolve({ ok: false, reason: "not-implemented" });
  });

  ipcMain.handle(CHANNELS.WINDOW_SET_FULLSCREEN, (_event, payload) => {
    if (mainWindow === null || mainWindow.isDestroyed()) {
      return Promise.resolve({ ok: false, reason: "no-window" });
    }
    const parsed = validateWindowFullscreenPayload(payload);
    if (!parsed.valid) {
      return Promise.resolve({ ok: false, reason: parsed.reason });
    }
    mainWindow.setFullScreen(parsed.fullscreen);
    shellLogger.info("window fullscreen (IPC)", { fullscreen: parsed.fullscreen });
    return Promise.resolve({ ok: true });
  });
}

registerIpcHandlers();

function createWindow() {
  disposeWindowExtras();
  const workArea = screen.getPrimaryDisplay().workArea;
  const preloadPath = path.join(__dirname, "preload.cjs");
  const distIndexPath = path.join(__dirname, "..", "dist", "index.html");

  const { win, dispose } = createMainWindow({
    workArea,
    shellProfile,
    shellLogger,
    CHANNELS,
    dialog,
    isDev,
    devUrl: process.env.VITE_DEV_SERVER_URL,
    preloadPath,
    distIndexPath,
  });

  mainWindow = win;
  disposeWindowExtras = dispose;

  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
    disposeWindowExtras();
    disposeWindowExtras = () => {};
  });
}

app.whenReady().then(() => {
  const mode = shellProfile.getShellWindowMode();
  shellLogger.info("app ready", {
    isDev,
    windowMode: mode,
    profile: process.env.ORANGETV_ELECTRON__SHELL_PROFILE,
  });
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
