/**
 * Main-process shell logging (stderr). No file sink; keep dependency-free.
 */

const shellProfile = require("./shell-profile.cjs");

function formatLine(level, message, meta) {
  const ts = new Date().toISOString();
  const suffix =
    meta !== undefined && meta !== null && Object.keys(meta).length > 0
      ? ` ${JSON.stringify(meta)}`
      : "";
  return `[OrangeTv:shell] ${ts} ${level} ${message}${suffix}`;
}

function info(message, meta) {
  console.error(formatLine("INFO", message, meta));
}

function warn(message, meta) {
  console.error(formatLine("WARN", message, meta));
}

function error(message, meta) {
  console.error(formatLine("ERROR", message, meta));
}

/**
 * @param {import("electron").App | undefined} app
 */
function installAppDiagnostics(app) {
  if (!app?.on) {
    return;
  }
  app.on("child-process-gone", (_event, details) => {
    error("child-process-gone", {
      type: details?.type,
      reason: details?.reason,
      name: details?.name,
      serviceName: details?.serviceName,
    });
  });
}

function installMainProcessHandlers() {
  process.on("uncaughtException", (err) => {
    error("uncaughtException", {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "unhandledRejection";
    error("unhandledRejection", {
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    process.exit(1);
  });
}

/**
 * @param {import('electron').BrowserWindow} win
 */
function attachWindowDiagnostics(win) {
  const wc = win.webContents;
  let unresponsiveNoted = false;

  wc.on("did-finish-load", () => {
    if (shellProfile.isDevElectron()) {
      info("did-finish-load", { title: win.getTitle() });
    }
  });

  wc.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    error("did-fail-load", {
      errorCode,
      errorDescription,
      validatedURL,
    });
  });

  wc.on("render-process-gone", (event, details) => {
    error("render-process-gone", {
      reason: details.reason,
      exitCode: details.exitCode,
    });
  });

  wc.on("unresponsive", () => {
    if (!unresponsiveNoted) {
      unresponsiveNoted = true;
      warn("window unresponsive");
    }
  });

  wc.on("responsive", () => {
    if (unresponsiveNoted) {
      unresponsiveNoted = false;
      info("window responsive again");
    }
  });
}

module.exports = {
  info,
  warn,
  error,
  installMainProcessHandlers,
  installAppDiagnostics,
  attachWindowDiagnostics,
};
