const assert = require("node:assert");
const { describe, it } = require("node:test");

const {
  fullscreenBounds,
  validateWebShellUrl,
  classifyWebShellKey,
} = require("./web-shell-container.cjs");

describe("fullscreenBounds", () => {
  it("returns a rectangle pinned to the window content origin", () => {
    const b = fullscreenBounds({ width: 1920, height: 1080 });
    assert.deepStrictEqual(b, { x: 0, y: 0, width: 1920, height: 1080 });
  });

  it("falls back to zero when size is missing or negative", () => {
    assert.deepStrictEqual(fullscreenBounds({}), { x: 0, y: 0, width: 0, height: 0 });
    assert.deepStrictEqual(
      fullscreenBounds({ width: -10, height: 0 }),
      { x: 0, y: 0, width: 0, height: 0 },
    );
  });
});

describe("validateWebShellUrl", () => {
  it("accepts https without an allow-list", () => {
    const r = validateWebShellUrl("https://www.netflix.com/browse");
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.host, "www.netflix.com");
  });

  it("rejects http and other protocols", () => {
    const r = validateWebShellUrl("http://example.com");
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, "protocol-not-allowed");
  });

  it("rejects malformed input", () => {
    assert.strictEqual(validateWebShellUrl("").ok, false);
    assert.strictEqual(validateWebShellUrl("not a url").ok, false);
    assert.strictEqual(validateWebShellUrl(undefined).ok, false);
  });

  it("accepts hosts when allow-list matches", () => {
    const r = validateWebShellUrl("https://www.primevideo.com", ["primevideo.com"]);
    assert.strictEqual(r.ok, true);
  });

  it("rejects hosts outside the allow-list", () => {
    const r = validateWebShellUrl("https://example.com", ["netflix.com"]);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, "host-not-allowed");
  });

  it("matches exact host (not only suffix)", () => {
    const r = validateWebShellUrl("https://disneyplus.com/home", ["disneyplus.com"]);
    assert.strictEqual(r.ok, true);
  });
});

describe("classifyWebShellKey", () => {
  it("captures Escape, Backspace, Home, ContextMenu (shell owns back + menu)", () => {
    assert.strictEqual(classifyWebShellKey("Escape"), "capture");
    assert.strictEqual(classifyWebShellKey("Backspace"), "capture");
    assert.strictEqual(classifyWebShellKey("Home"), "capture");
    assert.strictEqual(classifyWebShellKey("ContextMenu"), "capture");
  });

  it("forwards navigation and playback keys to the page", () => {
    for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " "]) {
      assert.strictEqual(classifyWebShellKey(key), "forward", `forward:${key}`);
    }
  });

  it("ignores empty and non-string keys", () => {
    assert.strictEqual(classifyWebShellKey(""), "ignore");
    assert.strictEqual(classifyWebShellKey(undefined), "ignore");
    assert.strictEqual(classifyWebShellKey(123), "ignore");
  });
});
