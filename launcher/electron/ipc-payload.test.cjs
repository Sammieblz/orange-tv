/**
 * Unit tests for ipc-payload.cjs (no Electron).
 */
const assert = require("node:assert");
const { describe, it } = require("node:test");

const {
  validateLaunchPayload,
  validateWindowFullscreenPayload,
} = require("./ipc-payload.cjs");

describe("validateLaunchPayload", () => {
  it("rejects null and non-objects", () => {
    assert.strictEqual(validateLaunchPayload(null).valid, false);
    assert.strictEqual(validateLaunchPayload(undefined).valid, false);
    assert.strictEqual(validateLaunchPayload("x").valid, false);
    assert.strictEqual(validateLaunchPayload([]).valid, false);
  });

  it("requires non-empty kind string <= 64 chars", () => {
    assert.strictEqual(validateLaunchPayload({}).valid, false);
    assert.strictEqual(validateLaunchPayload({ kind: "" }).valid, false);
    assert.strictEqual(validateLaunchPayload({ kind: "a".repeat(65) }).valid, false);
  });

  it("accepts minimal valid payload", () => {
    const r = validateLaunchPayload({ kind: "app" });
    assert.strictEqual(r.valid, true);
    if (r.valid) {
      assert.strictEqual(r.kind, "app");
      assert.strictEqual(r.id, undefined);
    }
  });

  it("validates optional id length", () => {
    assert.strictEqual(validateLaunchPayload({ kind: "x", id: "a".repeat(257) }).valid, false);
    const r = validateLaunchPayload({ kind: "x", id: "tile-1" });
    assert.strictEqual(r.valid, true);
    if (r.valid) {
      assert.strictEqual(r.id, "tile-1");
    }
  });
});

describe("validateWindowFullscreenPayload", () => {
  it("rejects invalid shapes", () => {
    assert.strictEqual(validateWindowFullscreenPayload(null).valid, false);
    assert.strictEqual(validateWindowFullscreenPayload({}).valid, false);
    assert.strictEqual(validateWindowFullscreenPayload({ fullscreen: "yes" }).valid, false);
    assert.strictEqual(validateWindowFullscreenPayload([]).valid, false);
  });

  it("accepts boolean fullscreen", () => {
    const r = validateWindowFullscreenPayload({ fullscreen: true });
    assert.strictEqual(r.valid, true);
    if (r.valid) {
      assert.strictEqual(r.fullscreen, true);
    }
    const r2 = validateWindowFullscreenPayload({ fullscreen: false });
    assert.strictEqual(r2.valid, true);
    if (r2.valid) {
      assert.strictEqual(r2.fullscreen, false);
    }
  });
});
