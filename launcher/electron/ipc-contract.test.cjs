/**
 * Contract sanity checks for IPC channel names (no Electron).
 */
const assert = require("node:assert");
const { describe, it } = require("node:test");

const { CHANNELS, RENDERER_INVOKE_CHANNELS } = require("./ipc-contract.cjs");

describe("CHANNELS", () => {
  it("defines stable orange-tv prefixed names", () => {
    assert.strictEqual(CHANNELS.PING, "orange-tv:ping");
    assert.strictEqual(CHANNELS.LAUNCH_REQUEST, "orange-tv:launch-request");
    assert.strictEqual(CHANNELS.SHELL_FOREGROUND, "orange-tv:shell-foreground");
    assert.strictEqual(CHANNELS.WINDOW_SET_FULLSCREEN, "orange-tv:window-set-fullscreen");
    assert.strictEqual(CHANNELS.SHELL_FOCUS, "orange-tv:shell-focus");
    assert.strictEqual(CHANNELS.WEB_SHELL_OPEN, "orange-tv:web-shell-open");
    assert.strictEqual(CHANNELS.WEB_SHELL_CLOSE, "orange-tv:web-shell-close");
    assert.strictEqual(CHANNELS.WEB_SHELL_STATE, "orange-tv:web-shell-state");
  });

  it("uses unique values", () => {
    const values = Object.values(CHANNELS);
    assert.strictEqual(new Set(values).size, values.length);
  });
});

describe("RENDERER_INVOKE_CHANNELS", () => {
  it("lists invoke-only channels used by the preload bridge", () => {
    assert.deepStrictEqual(RENDERER_INVOKE_CHANNELS, [
      CHANNELS.PING,
      CHANNELS.LAUNCH_REQUEST,
      CHANNELS.WINDOW_SET_FULLSCREEN,
      CHANNELS.SHELL_FOCUS,
      CHANNELS.WEB_SHELL_OPEN,
      CHANNELS.WEB_SHELL_CLOSE,
    ]);
  });

  it("does not expose the main->renderer push channel for invoke", () => {
    assert.ok(!RENDERER_INVOKE_CHANNELS.includes(CHANNELS.WEB_SHELL_STATE));
    assert.ok(!RENDERER_INVOKE_CHANNELS.includes(CHANNELS.SHELL_FOREGROUND));
  });
});
