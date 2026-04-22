const assert = require("node:assert");
const { describe, it } = require("node:test");

const { stripElectronFromUserAgent } = require("./web-shell-useragent.cjs");

describe("stripElectronFromUserAgent", () => {
  it("removes Electron/<version> token while keeping the rest of the UA intact", () => {
    const before =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) orange-tv/1.0.0 Chrome/131.0.0.0 Electron/31.7.7 Safari/537.36";
    const after = stripElectronFromUserAgent(before);
    assert.ok(!/Electron/i.test(after));
    assert.ok(after.includes("Chrome/131.0.0.0"));
    assert.ok(after.includes("Safari/537.36"));
  });

  it("collapses the double-space that would otherwise be left behind", () => {
    const before = "Foo Chrome/1 Electron/2 Safari/3";
    const after = stripElectronFromUserAgent(before);
    assert.strictEqual(after, "Foo Chrome/1 Safari/3");
  });

  it("is a no-op when no Electron token is present", () => {
    const ua = "Mozilla/5.0 (Linux; Tizen 6.0) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36";
    assert.strictEqual(stripElectronFromUserAgent(ua), ua);
  });

  it("handles empty / non-string input defensively", () => {
    assert.strictEqual(stripElectronFromUserAgent(""), "");
    // @ts-expect-error: exercising defensive branch
    assert.strictEqual(stripElectronFromUserAgent(undefined), undefined);
  });
});
