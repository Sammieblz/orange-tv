/**
 * Contract sanity checks for IPC channel names (no Electron).
 */
const assert = require("node:assert");
const { describe, it } = require("node:test");

const { CHANNELS } = require("./ipc-contract.cjs");

describe("CHANNELS", () => {
  it("defines stable orange-tv prefixed names", () => {
    assert.strictEqual(CHANNELS.PING, "orange-tv:ping");
    assert.strictEqual(CHANNELS.LAUNCH_REQUEST, "orange-tv:launch-request");
    assert.strictEqual(CHANNELS.SHELL_FOREGROUND, "orange-tv:shell-foreground");
    assert.strictEqual(CHANNELS.WINDOW_SET_FULLSCREEN, "orange-tv:window-set-fullscreen");
  });

  it("uses unique values", () => {
    const values = Object.values(CHANNELS);
    assert.strictEqual(new Set(values).size, values.length);
  });
});
