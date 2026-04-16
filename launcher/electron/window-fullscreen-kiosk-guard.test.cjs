const assert = require("node:assert");
const { describe, it } = require("node:test");

const { resolveWindowSetFullscreenWhenKioskLocked } = require("./window-fullscreen-kiosk-guard.cjs");

describe("resolveWindowSetFullscreenWhenKioskLocked", () => {
  it("blocks leaving fullscreen when kiosk locked", () => {
    const r = resolveWindowSetFullscreenWhenKioskLocked(true, false);
    assert.strictEqual(r.blocked, true);
    assert.strictEqual(r.reason, "kiosk-fullscreen-locked");
  });

  it("allows staying in fullscreen when kiosk locked", () => {
    const r = resolveWindowSetFullscreenWhenKioskLocked(true, true);
    assert.strictEqual(r.blocked, false);
  });

  it("allows leaving fullscreen when not kiosk locked", () => {
    const r = resolveWindowSetFullscreenWhenKioskLocked(false, false);
    assert.strictEqual(r.blocked, false);
  });
});
