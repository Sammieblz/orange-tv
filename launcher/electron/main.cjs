const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const path = require("path");
const shellLogger = require("./shell-logger.cjs");
const { CHANNELS } = require("./ipc-contract.cjs");
const shellProfile = require("./shell-profile.cjs");

shellLogger.installMainProcessHandlers();

const isDev = shellProfile.isDevElectron();

/**
 * @param {unknown} payload
 */
function validateLaunchPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, reason: "invalid-payload" };
  }
  const kind = /** @type {{ kind?: unknown; id?: unknown }} */ (payload).kind;
  if (typeof kind !== "string" || kind.length === 0 || kind.length > 64) {
    return { valid: false, reason: "invalid-kind" };
  }
  const id = /** @type {{ kind?: unknown; id?: unknown }} */ (payload).id;
  if (id !== undefined && (typeof id !== "string" || id.length > 256)) {
    return { valid: false, reason: "invalid-id" };
  }
  return { valid: true, kind, id };
}

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
}

registerIpcHandlers();

function createWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;
  const chromeOpts = shellProfile.getWindowChromeOptions({
    width: workArea.width,
    height: workArea.height,
    x: workArea.x,
    y: workArea.y,
  });

  const win = new BrowserWindow({
    ...chromeOpts,
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  shellLogger.attachWindowDiagnostics(win);

  win.once("ready-to-show", () => {
    win.show();
    if (shellProfile.shouldOpenDevtools()) {
      win.webContents.openDevTools({ mode: "detach" });
    }
  });

  const loadPromise = isDev
    ? win.loadURL(process.env.VITE_DEV_SERVER_URL || "http://localhost:5173")
    : win.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  void loadPromise.catch((err) => {
    shellLogger.error("failed to load shell content", {
      message: err?.message,
      stack: err?.stack,
    });
    dialog.showErrorBox(
      "Orange TV",
      `The launcher could not load.\n\n${err?.message || String(err)}`,
    );
  });
}

app.whenReady().then(() => {
  shellLogger.info("app ready", { isDev, profile: process.env.ORANGETV_ELECTRON__SHELL_PROFILE });
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
