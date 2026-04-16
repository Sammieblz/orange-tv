/**
 * Unit tests for window-lifecycle.cjs exports that do not require Electron BrowserWindow.
 */
const assert = require("node:assert");
const { describe, it } = require("node:test");

const {
  applyPostShowFullscreenChrome,
  registerDevFullscreenShortcut,
} = require("./window-lifecycle.cjs");

function withPlatform(platform, fn) {
  const prev = process.platform;
  Object.defineProperty(process, "platform", {
    value: platform,
    configurable: true,
    writable: true,
  });
  try {
    fn();
  } finally {
    Object.defineProperty(process, "platform", {
      value: prev,
      configurable: true,
      writable: true,
    });
  }
}

describe("applyPostShowFullscreenChrome", () => {
  it("applies fullscreen and kiosk on win32 when options are true", () => {
    withPlatform("win32", () => {
      const calls = [];
      const win = {
        setFullScreen: (v) => calls.push(["setFullScreen", v]),
        setKiosk: (v) => calls.push(["setKiosk", v]),
      };
      applyPostShowFullscreenChrome(win, { fullscreen: true, kiosk: true });
      assert.deepStrictEqual(calls, [
        ["setFullScreen", true],
        ["setKiosk", true],
      ]);
    });
  });

  it("applies fullscreen and kiosk on linux when options are true", () => {
    withPlatform("linux", () => {
      const calls = [];
      const win = {
        setFullScreen: (v) => calls.push(["setFullScreen", v]),
        setKiosk: (v) => calls.push(["setKiosk", v]),
      };
      applyPostShowFullscreenChrome(win, { fullscreen: true, kiosk: true });
      assert.deepStrictEqual(calls, [
        ["setFullScreen", true],
        ["setKiosk", true],
      ]);
    });
  });

  it("only sets fullscreen when kiosk is false", () => {
    withPlatform("linux", () => {
      const calls = [];
      const win = {
        setFullScreen: (v) => calls.push(["setFullScreen", v]),
        setKiosk: (v) => calls.push(["setKiosk", v]),
      };
      applyPostShowFullscreenChrome(win, { fullscreen: true, kiosk: false });
      assert.deepStrictEqual(calls, [["setFullScreen", true]]);
    });
  });
});

describe("registerDevFullscreenShortcut", () => {
  it("returns noop when not dev", () => {
    const shellProfile = {
      isDevElectron: () => false,
      isApplianceProfile: () => false,
      isKioskLockedShell: () => false,
    };
    const shellLogger = { info: () => {}, warn: () => {} };
    const win = { isDestroyed: () => false, setFullScreen: () => {}, isFullScreen: () => false };
    const dispose = registerDevFullscreenShortcut(win, shellProfile, shellLogger);
    assert.strictEqual(typeof dispose, "function");
    dispose();
  });

  it("returns noop when appliance profile even if dev", () => {
    const shellProfile = {
      isDevElectron: () => true,
      isApplianceProfile: () => true,
      isKioskLockedShell: () => true,
    };
    const shellLogger = { info: () => {}, warn: () => {} };
    const win = { isDestroyed: () => false };
    const dispose = registerDevFullscreenShortcut(win, shellProfile, shellLogger);
    dispose();
  });
});
