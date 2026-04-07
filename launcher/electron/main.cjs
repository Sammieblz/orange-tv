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
shellLogger.installAppDiagnostics(app);

const isDev = shellProfile.isDevElectron();

/** @type {import("electron").BrowserWindow | null} */
let mainWindow = null;
let disposeWindowExtras = () => {};

function registerIpcHandlers() {
  ipcMain.handle(CHANNELS.PING, () => "pong");

  ipcMain.handle(CHANNELS.LAUNCH_REQUEST, (_event, payload) => {
    const parsed = validateLaunchPayload(payload);
    if (!parsed.valid) {
      shellLogger.warn("launch_outcome", {
        event: "launch_outcome",
        ok: false,
        reason: parsed.reason,
      });
      return Promise.resolve({ ok: false, reason: parsed.reason });
    }
    const result = { ok: false, reason: "not-implemented" };
    shellLogger.warn("launch_outcome", {
      event: "launch_outcome",
      ok: result.ok,
      reason: result.reason,
      kind: parsed.kind,
      id: parsed.id,
    });
    return Promise.resolve(result);
  });

  ipcMain.handle(CHANNELS.WINDOW_SET_FULLSCREEN, (_event, payload) => {
    if (mainWindow === null || mainWindow.isDestroyed()) {
      shellLogger.warn("window_set_fullscreen", {
        event: "window_set_fullscreen",
        ok: false,
        reason: "no-window",
      });
      return Promise.resolve({ ok: false, reason: "no-window" });
    }
    const parsed = validateWindowFullscreenPayload(payload);
    if (!parsed.valid) {
      shellLogger.warn("window_set_fullscreen", {
        event: "window_set_fullscreen",
        ok: false,
        reason: parsed.reason,
      });
      return Promise.resolve({ ok: false, reason: parsed.reason });
    }
    mainWindow.setFullScreen(parsed.fullscreen);
    shellLogger.info("window_set_fullscreen", {
      event: "window_set_fullscreen",
      ok: true,
      fullscreen: parsed.fullscreen,
    });
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
