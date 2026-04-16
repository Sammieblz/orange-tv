/**
 * Shell chrome from environment (Electron main / preload read process.env).
 * Not Vite: set these in the shell environment or OS env when launching Electron.
 */

function readBool(env, key) {
  const v = env[key];
  return v === "1" || (typeof v === "string" && v.toLowerCase() === "true");
}

function isDevElectron() {
  return readBool(process.env, "ELECTRON_IS_DEV");
}

function isApplianceProfile() {
  return process.env.ORANGETV_ELECTRON__SHELL_PROFILE === "appliance";
}

function isKioskFlag() {
  return readBool(process.env, "ORANGETV_ELECTRON__KIOSK");
}

/** Appliance or explicit kiosk: shell should stay fullscreen (no casual exit). */
function isKioskLockedShell() {
  return isApplianceProfile() || isKioskFlag();
}

function shouldOpenDevtools() {
  return (
    isDevElectron() &&
    !isApplianceProfile() &&
    readBool(process.env, "ORANGETV_ELECTRON__OPEN_DEVTOOLS")
  );
}

/**
 * Summarizes window/runtime mode for logging and tests (single source with getWindowChromeOptions).
 * @returns {{ profile: string; kiosk: boolean; loadDevUrl: boolean; fullscreen: boolean }}
 */
function getShellWindowMode() {
  const appliance = isApplianceProfile();
  const kiosk = isKioskFlag();
  return {
    profile: appliance ? "appliance" : process.env.ORANGETV_ELECTRON__SHELL_PROFILE || "default",
    kiosk,
    loadDevUrl: isDevElectron(),
    fullscreen: appliance || kiosk,
  };
}

/**
 * @param {{ width: number; height: number; x: number; y: number }} workArea
 */
function getWindowChromeOptions(workArea) {
  const appliance = isApplianceProfile();
  const kiosk = isKioskFlag();

  if (appliance || kiosk) {
    return {
      width: workArea.width,
      height: workArea.height,
      x: workArea.x,
      y: workArea.y,
      fullscreen: true,
      kiosk,
      autoHideMenuBar: true,
    };
  }

  const w = Math.min(1280, Math.max(800, workArea.width - 96));
  const h = Math.min(720, Math.max(600, workArea.height - 96));
  const x = workArea.x + Math.floor((workArea.width - w) / 2);
  const y = workArea.y + Math.floor((workArea.height - h) / 2);

  return {
    width: w,
    height: h,
    x,
    y,
    fullscreen: false,
    kiosk: false,
    autoHideMenuBar: isDevElectron(),
  };
}

/**
 * Metadata policy for preload getRuntimeMetadata (minimal in appliance).
 */
function getRuntimeMetadataPayload() {
  if (isApplianceProfile()) {
    return { shellProfile: "appliance", channel: "stable" };
  }
  const profile = process.env.ORANGETV_ELECTRON__SHELL_PROFILE || "default";
  if (isDevElectron()) {
    return {
      shellProfile: profile,
      node: process.versions.node,
      chrome: process.versions.chrome,
      electron: process.versions.electron,
    };
  }
  return {
    shellProfile: profile,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  };
}

module.exports = {
  isDevElectron,
  isApplianceProfile,
  isKioskFlag,
  isKioskLockedShell,
  shouldOpenDevtools,
  getShellWindowMode,
  getWindowChromeOptions,
  getRuntimeMetadataPayload,
};
