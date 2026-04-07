const assert = require("node:assert");
const { describe, it } = require("node:test");

const { CHANNELS, RENDERER_INVOKE_CHANNELS } = require("./ipc-contract.cjs");
const { ORANGE_TV_BRIDGE_KEYS, createOrangeTvBridge } = require("./preload-bridge.cjs");

describe("createOrangeTvBridge", () => {
  it("exposes exactly ORANGE_TV_BRIDGE_KEYS", () => {
    const ipcRenderer = {
      invoke: () => Promise.resolve(),
      on: () => {},
      removeListener: () => {},
    };
    const shellProfile = {
      getRuntimeMetadataPayload: () => ({ shellProfile: "test" }),
    };
    const bridge = createOrangeTvBridge(ipcRenderer, shellProfile);
    assert.deepStrictEqual(Object.keys(bridge).sort(), [...ORANGE_TV_BRIDGE_KEYS].sort());
  });

  it("invoke paths use approved CHANNELS only", async () => {
    /** @type {string[]} */
    const invoked = [];
    const ipcRenderer = {
      invoke: (channel, payload) => {
        invoked.push(channel);
        if (channel === CHANNELS.PING) {
          return Promise.resolve("pong");
        }
        if (channel === CHANNELS.LAUNCH_REQUEST) {
          return Promise.resolve({ ok: true });
        }
        if (channel === CHANNELS.WINDOW_SET_FULLSCREEN) {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve(undefined);
      },
      on: () => {},
      removeListener: () => {},
    };
    const shellProfile = {
      getRuntimeMetadataPayload: () => ({}),
    };
    const bridge = createOrangeTvBridge(ipcRenderer, shellProfile);

    await bridge.ping();
    await bridge.launchRequest({ kind: "x" });
    await bridge.setFullscreen(true);

    assert.deepStrictEqual(invoked, [
      CHANNELS.PING,
      CHANNELS.LAUNCH_REQUEST,
      CHANNELS.WINDOW_SET_FULLSCREEN,
    ]);
    for (const ch of invoked) {
      assert.ok(RENDERER_INVOKE_CHANNELS.includes(ch));
    }
  });

  it("onShellForeground subscribes on SHELL_FOREGROUND", () => {
    /** @type {Array<[string, () => void]>} */
    const subs = [];
    const ipcRenderer = {
      invoke: () => Promise.resolve(),
      on: (channel, listener) => {
        subs.push([channel, listener]);
      },
      removeListener: (channel, listener) => {
        const i = subs.findIndex((s) => s[0] === channel && s[1] === listener);
        if (i >= 0) {
          subs.splice(i, 1);
        }
      },
    };
    const shellProfile = {
      getRuntimeMetadataPayload: () => ({}),
    };
    const bridge = createOrangeTvBridge(ipcRenderer, shellProfile);
    let calls = 0;
    const unsub = bridge.onShellForeground(() => {
      calls += 1;
    });
    assert.strictEqual(subs.length, 1);
    assert.strictEqual(subs[0][0], CHANNELS.SHELL_FOREGROUND);
    subs[0][1]();
    assert.strictEqual(calls, 1);
    unsub();
    assert.strictEqual(subs.length, 0);
  });
});

describe("ORANGE_TV_BRIDGE_KEYS", () => {
  it("is frozen and stable length", () => {
    assert.ok(Object.isFrozen(ORANGE_TV_BRIDGE_KEYS));
    assert.strictEqual(ORANGE_TV_BRIDGE_KEYS.length, 5);
  });
});
