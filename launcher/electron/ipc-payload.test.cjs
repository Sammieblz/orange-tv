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

  it("requires kind app with non-empty id", () => {
    assert.strictEqual(validateLaunchPayload({}).valid, false);
    assert.strictEqual(validateLaunchPayload({ kind: "" }).valid, false);
    assert.strictEqual(validateLaunchPayload({ kind: "app" }).valid, false);
    assert.strictEqual(validateLaunchPayload({ kind: "other", id: "x" }).valid, false);
    const r = validateLaunchPayload({ kind: "app", id: "launch-streaming-demo" });
    assert.strictEqual(r.valid, true);
    if (r.valid) {
      assert.strictEqual(r.kind, "app");
      assert.strictEqual(r.id, "launch-streaming-demo");
    }
  });

  it("rejects id too long", () => {
    assert.strictEqual(validateLaunchPayload({ kind: "app", id: "a".repeat(257) }).valid, false);
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
