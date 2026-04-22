/**
 * Unit tests for ipc-payload.cjs (no Electron).
 */
const assert = require("node:assert");
const { describe, it } = require("node:test");

const {
  validateLaunchPayload,
  validateWindowFullscreenPayload,
  validateWebShellOpenPayload,
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

  it("accepts kind media with valid guid", () => {
    const r = validateLaunchPayload({
      kind: "media",
      mediaItemId: "550e8400-e29b-41d4-a716-446655440000",
    });
    assert.strictEqual(r.valid, true);
    if (r.valid) {
      assert.strictEqual(r.kind, "media");
      assert.strictEqual(r.mediaItemId, "550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("rejects invalid media guid", () => {
    assert.strictEqual(
      validateLaunchPayload({ kind: "media", mediaItemId: "not-a-guid" }).valid,
      false,
    );
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

describe("validateWebShellOpenPayload", () => {
  it("rejects null / non-objects / arrays", () => {
    assert.strictEqual(validateWebShellOpenPayload(null).valid, false);
    assert.strictEqual(validateWebShellOpenPayload(undefined).valid, false);
    assert.strictEqual(validateWebShellOpenPayload("x").valid, false);
    assert.strictEqual(validateWebShellOpenPayload([]).valid, false);
  });

  it("requires a non-empty url string", () => {
    assert.strictEqual(validateWebShellOpenPayload({ appId: "x" }).valid, false);
    assert.strictEqual(validateWebShellOpenPayload({ url: "", appId: "x" }).valid, false);
    assert.strictEqual(
      validateWebShellOpenPayload({ url: "a".repeat(2049), appId: "x" }).valid,
      false,
    );
  });

  it("requires a non-empty appId string", () => {
    assert.strictEqual(validateWebShellOpenPayload({ url: "https://netflix.com" }).valid, false);
    assert.strictEqual(
      validateWebShellOpenPayload({ url: "https://netflix.com", appId: "" }).valid,
      false,
    );
    assert.strictEqual(
      validateWebShellOpenPayload({ url: "https://netflix.com", appId: "a".repeat(257) }).valid,
      false,
    );
  });

  it("accepts required fields + defaults segment to null when omitted", () => {
    const r = validateWebShellOpenPayload({ url: "https://netflix.com", appId: "netflix" });
    assert.strictEqual(r.valid, true);
    if (r.valid) {
      assert.strictEqual(r.url, "https://netflix.com");
      assert.strictEqual(r.appId, "netflix");
      assert.strictEqual(r.chromeProfileSegment, null);
    }
  });

  it("accepts optional segment when provided as a reasonable string", () => {
    const r = validateWebShellOpenPayload({
      url: "https://netflix.com",
      appId: "netflix",
      chromeProfileSegment: "shared-streaming",
    });
    assert.strictEqual(r.valid, true);
    if (r.valid) {
      assert.strictEqual(r.chromeProfileSegment, "shared-streaming");
    }
  });

  it("rejects non-string or over-length segment", () => {
    assert.strictEqual(
      validateWebShellOpenPayload({
        url: "https://netflix.com",
        appId: "netflix",
        chromeProfileSegment: 123,
      }).valid,
      false,
    );
    assert.strictEqual(
      validateWebShellOpenPayload({
        url: "https://netflix.com",
        appId: "netflix",
        chromeProfileSegment: "a".repeat(129),
      }).valid,
      false,
    );
  });

  it("treats null segment as 'not provided' (valid)", () => {
    const r = validateWebShellOpenPayload({
      url: "https://netflix.com",
      appId: "netflix",
      chromeProfileSegment: null,
    });
    assert.strictEqual(r.valid, true);
    if (r.valid) {
      assert.strictEqual(r.chromeProfileSegment, null);
    }
  });
});
