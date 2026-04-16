/**
 * Node unit tests for shell-profile.cjs (pure env → options). Run: npm run test:electron
 */
const assert = require("node:assert");
const path = require("node:path");
const { describe, it } = require("node:test");

const profileModulePath = path.join(__dirname, "shell-profile.cjs");

/**
 * @param {Record<string, string | undefined>} overrides
 * @param {(sp: typeof import("./shell-profile.cjs")) => void} fn
 */
function withEnv(overrides, fn) {
  const keys = Object.keys(overrides);
  const saved = {};
  for (const k of keys) {
    saved[k] = process.env[k];
    const v = overrides[k];
    if (v === undefined || v === null) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  delete require.cache[profileModulePath];
  try {
    fn(require("./shell-profile.cjs"));
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = saved[k];
      }
    }
    delete require.cache[profileModulePath];
  }
}

describe("getShellWindowMode", () => {
  it("defaults to windowed when no appliance/kiosk", () => {
    withEnv({ ELECTRON_IS_DEV: "1", ORANGETV_ELECTRON__SHELL_PROFILE: undefined }, (sp) => {
      const m = sp.getShellWindowMode();
      assert.strictEqual(m.loadDevUrl, true);
      assert.strictEqual(m.fullscreen, false);
      assert.strictEqual(m.kiosk, false);
    });
  });

  it("appliance implies fullscreen", () => {
    withEnv({ ORANGETV_ELECTRON__SHELL_PROFILE: "appliance" }, (sp) => {
      const m = sp.getShellWindowMode();
      assert.strictEqual(m.fullscreen, true);
      assert.strictEqual(m.profile, "appliance");
    });
  });

  it("kiosk implies fullscreen flag in mode summary", () => {
    withEnv({ ORANGETV_ELECTRON__KIOSK: "1" }, (sp) => {
      const m = sp.getShellWindowMode();
      assert.strictEqual(m.kiosk, true);
      assert.strictEqual(m.fullscreen, true);
    });
  });
});

describe("isKioskLockedShell", () => {
  it("is true for appliance or kiosk flag", () => {
    withEnv({ ORANGETV_ELECTRON__SHELL_PROFILE: "appliance" }, (sp) => {
      assert.strictEqual(sp.isKioskLockedShell(), true);
    });
    withEnv({ ORANGETV_ELECTRON__KIOSK: "1" }, (sp) => {
      assert.strictEqual(sp.isKioskLockedShell(), true);
    });
    withEnv({}, (sp) => {
      assert.strictEqual(sp.isKioskLockedShell(), false);
    });
  });
});

describe("getWindowChromeOptions", () => {
  const workArea = { width: 1920, height: 1080, x: 0, y: 0 };

  it("centers a bounded window when not appliance", () => {
    withEnv({}, (sp) => {
      const o = sp.getWindowChromeOptions(workArea);
      assert.strictEqual(o.fullscreen, false);
      assert.strictEqual(o.kiosk, false);
      assert.ok(o.width >= 800 && o.width <= 1280);
      assert.ok(o.height >= 600 && o.height <= 720);
    });
  });

  it("uses work area for appliance fullscreen", () => {
    withEnv({ ORANGETV_ELECTRON__SHELL_PROFILE: "appliance" }, (sp) => {
      const o = sp.getWindowChromeOptions(workArea);
      assert.strictEqual(o.fullscreen, true);
      assert.strictEqual(o.width, workArea.width);
      assert.strictEqual(o.height, workArea.height);
      assert.strictEqual(o.kiosk, false);
    });
  });

  it("sets kiosk when flag is true", () => {
    withEnv({ ORANGETV_ELECTRON__KIOSK: "true" }, (sp) => {
      const o = sp.getWindowChromeOptions(workArea);
      assert.strictEqual(o.kiosk, true);
      assert.strictEqual(o.fullscreen, true);
    });
  });
});
