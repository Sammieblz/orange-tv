const { BrowserWindow, globalShortcut } = require("electron");

/**
 * On some Linux window managers, reinforcing fullscreen/kiosk after `show()` matches the work area more reliably
 * than constructor flags alone.
 *
 * @param {import('electron').BrowserWindow} win
 * @param {{ fullscreen?: boolean; kiosk?: boolean }} chromeOpts
 */
function applyPostShowFullscreenChrome(win, chromeOpts) {
  if (process.platform !== "linux") {
    return;
  }
  if (chromeOpts.fullscreen) {
    win.setFullScreen(true);
  }
  if (chromeOpts.kiosk) {
    win.setKiosk(true);
  }
}

/**
 * @param {object} deps
 * @param {{ width: number; height: number; x: number; y: number }} deps.workArea
 * @param {typeof import("./shell-profile.cjs")} deps.shellProfile
 * @param {typeof import("./shell-logger.cjs")} deps.shellLogger
 * @param {typeof import("./ipc-contract.cjs").CHANNELS} deps.CHANNELS shell foreground channel
 * @param {typeof import("electron").dialog} deps.dialog
 * @param {boolean} deps.isDev
 * @param {string} [deps.devUrl]
 * @param {string} deps.preloadPath
 * @param {string} deps.distIndexPath
 */
function createMainWindow(deps) {
  const {
    workArea,
    shellProfile,
    shellLogger,
    CHANNELS,
    dialog,
    isDev,
    devUrl,
    preloadPath,
    distIndexPath,
  } = deps;

  const chromeOpts = shellProfile.getWindowChromeOptions(workArea);

  const win = new BrowserWindow({
    ...chromeOpts,
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  shellLogger.attachWindowDiagnostics(win);

  let shellHadBlur = false;
  win.on("blur", () => {
    shellHadBlur = true;
  });
  win.on("focus", () => {
    if (shellHadBlur && !win.isDestroyed()) {
      win.webContents.send(CHANNELS.SHELL_FOREGROUND);
    }
    shellHadBlur = false;
  });

  win.once("ready-to-show", () => {
    win.show();
    applyPostShowFullscreenChrome(win, chromeOpts);
    if (shellProfile.shouldOpenDevtools()) {
      win.webContents.openDevTools({ mode: "detach" });
    }
  });

  const loadPromise = isDev
    ? win.loadURL(devUrl || process.env.VITE_DEV_SERVER_URL || "http://localhost:5173")
    : win.loadFile(distIndexPath);

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

  const unregisterDevShortcut = registerDevFullscreenShortcut(win, shellProfile, shellLogger);

  function dispose() {
    unregisterDevShortcut();
  }

  return { win, dispose, chromeOpts };
}

/**
 * F11 toggles fullscreen in dev (non-appliance) for Linux/Windows validation without renderer code.
 *
 * @param {import('electron').BrowserWindow} win
 * @param {typeof import("./shell-profile.cjs")} shellProfile
 * @param {typeof import("./shell-logger.cjs")} shellLogger
 * @returns {() => void} unregister
 */
function registerDevFullscreenShortcut(win, shellProfile, shellLogger) {
  if (!shellProfile.isDevElectron() || shellProfile.isApplianceProfile()) {
    return () => {};
  }

  const ok = globalShortcut.register("F11", () => {
    if (win.isDestroyed()) {
      return;
    }
    const next = !win.isFullScreen();
    win.setFullScreen(next);
    shellLogger.info("dev fullscreen toggled (F11)", { fullscreen: next });
  });

  if (!ok) {
    shellLogger.warn("F11 fullscreen shortcut not registered (may lack accelerator availability)");
  }

  return () => {
    try {
      globalShortcut.unregister("F11");
    } catch {
      // best-effort
    }
  };
}

module.exports = {
  createMainWindow,
  applyPostShowFullscreenChrome,
  registerDevFullscreenShortcut,
};
