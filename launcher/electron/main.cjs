const { app, BrowserView, BrowserWindow, ipcMain, screen, session, dialog, globalShortcut } = require("electron");
const path = require("path");
const shellLogger = require("./shell-logger.cjs");
const { CHANNELS } = require("./ipc-contract.cjs");
const shellProfile = require("./shell-profile.cjs");
const { createMainWindow } = require("./window-lifecycle.cjs");
const {
  validateLaunchPayload,
  validateWindowFullscreenPayload,
  validateWebShellOpenPayload,
} = require("./ipc-payload.cjs");
const { postLaunch, postLaunchMedia } = require("./ipc-launch.cjs");
const { resolveWindowSetFullscreenWhenKioskLocked } = require("./window-fullscreen-kiosk-guard.cjs");
const { createWebShellManager } = require("./web-shell-manager.cjs");
const { stripElectronFromUserAgent } = require("./web-shell-useragent.cjs");

/**
 * Pixels at the top of the shell window reserved for the renderer's web-shell back bar.
 * The BrowserView is inset by this much so the React overlay (rendered in the main
 * BrowserWindow content) remains visible above the streaming content.
 */
const WEB_SHELL_TOP_INSET_PX = 44;

shellLogger.installMainProcessHandlers();
shellLogger.installAppDiagnostics(app);

const isDev = shellProfile.isDevElectron();

/** @type {import("electron").BrowserWindow | null} */
let mainWindow = null;
let disposeWindowExtras = () => {};
/** @type {ReturnType<typeof createWebShellManager> | null} */
let webShellManager = null;

function registerIpcHandlers() {
  ipcMain.handle(CHANNELS.PING, () => "pong");

  ipcMain.handle(CHANNELS.LAUNCH_REQUEST, async (_event, payload) => {
    const parsed = validateLaunchPayload(payload);
    if (!parsed.valid) {
      shellLogger.warn("launch_outcome", {
        event: "launch_outcome",
        ok: false,
        reason: parsed.reason,
      });
      return { ok: false, reason: parsed.reason };
    }
    try {
      const result =
        parsed.kind === "app"
          ? await postLaunch(parsed.id)
          : await postLaunchMedia(parsed.mediaItemId);
      if (result.ok) {
        shellLogger.info("launch_outcome", {
          event: "launch_outcome",
          ok: true,
          appId: parsed.kind === "app" ? parsed.id : undefined,
          mediaItemId: parsed.kind === "media" ? parsed.mediaItemId : undefined,
          sessionId: result.sessionId,
          pid: result.pid,
        });
      } else {
        shellLogger.warn("launch_outcome", {
          event: "launch_outcome",
          ok: false,
          reason: result.reason,
          appId: parsed.kind === "app" ? parsed.id : undefined,
          mediaItemId: parsed.kind === "media" ? parsed.mediaItemId : undefined,
        });
      }
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      shellLogger.warn("launch_outcome", {
        event: "launch_outcome",
        ok: false,
        reason: "launch-handler-error",
        appId: parsed.id,
        message,
      });
      return { ok: false, reason: "launch-handler-error" };
    }
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
    const kioskLock = resolveWindowSetFullscreenWhenKioskLocked(
      shellProfile.isKioskLockedShell(),
      parsed.fullscreen,
    );
    if (kioskLock.blocked) {
      shellLogger.warn("window_set_fullscreen", {
        event: "window_set_fullscreen",
        ok: false,
        reason: kioskLock.reason,
      });
      return Promise.resolve({ ok: false, reason: kioskLock.reason });
    }
    mainWindow.setFullScreen(parsed.fullscreen);
    shellLogger.info("window_set_fullscreen", {
      event: "window_set_fullscreen",
      ok: true,
      fullscreen: parsed.fullscreen,
    });
    return Promise.resolve({ ok: true });
  });

  ipcMain.handle(CHANNELS.SHELL_FOCUS, () => {
    if (mainWindow === null || mainWindow.isDestroyed()) {
      return Promise.resolve({ ok: false, reason: "no-window" });
    }
    try {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      shellLogger.warn("shell_focus", { event: "shell_focus", ok: false, message });
      return Promise.resolve({ ok: false, reason: "focus-failed" });
    }
    shellLogger.info("shell_focus", { event: "shell_focus", ok: true });
    return Promise.resolve({ ok: true });
  });

  ipcMain.handle(CHANNELS.WEB_SHELL_OPEN, async (_event, payload) => {
    if (!shellProfile.isWebShellEnabled()) {
      return { ok: false, reason: "web-shell-disabled" };
    }
    const parsed = validateWebShellOpenPayload(payload);
    if (!parsed.valid) {
      shellLogger.warn("web_shell_open", { event: "web_shell_open", ok: false, reason: parsed.reason });
      return { ok: false, reason: parsed.reason };
    }
    if (webShellManager === null) {
      return { ok: false, reason: "no-window" };
    }
    const result = await webShellManager.open({
      url: parsed.url,
      appId: parsed.appId,
      chromeProfileSegment: parsed.chromeProfileSegment,
    });
    if (result.ok) {
      shellLogger.info("web_shell_open", {
        event: "web_shell_open",
        ok: true,
        appId: parsed.appId,
      });
    } else {
      shellLogger.warn("web_shell_open", {
        event: "web_shell_open",
        ok: false,
        reason: result.reason,
        appId: parsed.appId,
      });
    }
    return result;
  });

  ipcMain.handle(CHANNELS.WEB_SHELL_CLOSE, async () => {
    if (!shellProfile.isWebShellEnabled()) {
      return { ok: false, reason: "web-shell-disabled" };
    }
    if (webShellManager === null) {
      return { ok: false, reason: "no-window" };
    }
    const result = await webShellManager.close();
    shellLogger.info("web_shell_close", { event: "web_shell_close", ok: result.ok });
    return result;
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

  if (shellProfile.isWebShellEnabled()) {
    webShellManager = createWebShellManager(createElectronWebShellDeps(win));
    shellLogger.info("web_shell_enabled", { event: "web_shell_enabled" });
  }

  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
    if (webShellManager !== null) {
      webShellManager.dispose();
      webShellManager = null;
    }
    disposeWindowExtras();
    disposeWindowExtras = () => {};
  });
}

/**
 * Build the Electron-facing deps for `createWebShellManager`. Kept as a factory so the
 * manager module can remain Electron-free for `node --test` coverage.
 *
 * @param {import("electron").BrowserWindow} win
 * @returns {import("./web-shell-manager.cjs").WebShellManagerDeps}
 */
function createElectronWebShellDeps(win) {
  return {
    getWindowContentSize: () => {
      if (win.isDestroyed()) return null;
      const [width, height] = win.getContentSize();
      return { width, height };
    },
    isWindowAlive: () => !win.isDestroyed(),
    onWindowResize: (handler) => {
      const listener = () => handler();
      win.on("resize", listener);
      return () => {
        try {
          win.removeListener("resize", listener);
        } catch {
          // best-effort
        }
      };
    },
    onWindowClosed: (handler) => {
      const listener = () => handler();
      win.once("closed", listener);
      return () => {
        try {
          win.removeListener("closed", listener);
        } catch {
          // best-effort
        }
      };
    },
    createView: ({ partition }) => {
      const ses = session.fromPartition(partition);
      const view = new BrowserView({
        webPreferences: {
          session: ses,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
      // Strip "Electron/<version>" from the UA — sites (Netflix in particular) will
      // otherwise throw a "download our app / not a supported browser" modal.
      try {
        const clean = stripElectronFromUserAgent(view.webContents.getUserAgent());
        view.webContents.setUserAgent(clean);
      } catch {
        // best-effort
      }
      // Deny every window.open / target="_blank": we are a shell, not a web browser.
      // The user chose this tile — they will leave via Back, not via a popup window.
      try {
        view.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      } catch {
        // best-effort
      }
      return view;
    },
    attachView: (view, bounds) => {
      if (win.isDestroyed()) return;
      const tView = /** @type {import("electron").BrowserView} */ (view);
      const current = win.getBrowserViews();
      if (!current.includes(tView)) {
        win.addBrowserView(tView);
      }
      // Inset from the top so the renderer's web-shell back bar stays visible.
      const insetBounds = {
        x: bounds.x,
        y: bounds.y + WEB_SHELL_TOP_INSET_PX,
        width: bounds.width,
        height: Math.max(0, bounds.height - WEB_SHELL_TOP_INSET_PX),
      };
      tView.setBounds(insetBounds);
      tView.setAutoResize({ width: true, height: true });
    },
    loadUrl: async (view, url) => {
      const tView = /** @type {import("electron").BrowserView} */ (view);
      await tView.webContents.loadURL(url);
    },
    detachAndDestroyView: (view) => {
      const tView = /** @type {import("electron").BrowserView} */ (view);
      if (!win.isDestroyed()) {
        try {
          win.removeBrowserView(tView);
        } catch {
          // best-effort
        }
      }
      try {
        tView.webContents.close();
      } catch {
        // best-effort
      }
    },
    installKeyGuard: (view, handler) => {
      const tView = /** @type {import("electron").BrowserView} */ (view);
      const listener = (event, input) => {
        const decision = handler({ key: input.key });
        if (decision === "capture") {
          event.preventDefault();
          if (webShellManager !== null) {
            void webShellManager.close();
          }
        }
      };
      tView.webContents.on("before-input-event", listener);
      return () => {
        try {
          tView.webContents.removeListener("before-input-event", listener);
        } catch {
          // best-effort
        }
      };
    },
    focusShellWindow: () => {
      if (win.isDestroyed()) return;
      try {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      } catch {
        // best-effort
      }
    },
    emitState: (event) => {
      if (win.isDestroyed()) return;
      try {
        win.webContents.send(CHANNELS.WEB_SHELL_STATE, event);
      } catch {
        // best-effort
      }
    },
    allowHosts: null,
  };
}

app.whenReady().then(() => {
  const mode = shellProfile.getShellWindowMode();
  const webShellEnabled = shellProfile.isWebShellEnabled();
  shellLogger.info("app ready", {
    isDev,
    windowMode: mode,
    profile: process.env.ORANGETV_ELECTRON__SHELL_PROFILE,
    webShellEnabled,
  });
  if (!webShellEnabled) {
    shellLogger.info("web_shell_disabled_hint", {
      event: "web_shell_disabled_hint",
      hint: "Set ORANGETV_ELECTRON__WEB_SHELL_ENABLED=1 to render streaming tiles as an in-window BrowserView instead of spawning Chrome. See docs/player-and-streaming-strategy.md.",
    });
  }
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
