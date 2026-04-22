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
      invoke: (channel) => {
        invoked.push(channel);
        return Promise.resolve({ ok: true });
      },
      on: () => {},
      removeListener: () => {},
    };
    const shellProfile = {
      getRuntimeMetadataPayload: () => ({}),
    };
    const bridge = createOrangeTvBridge(ipcRenderer, shellProfile);

    await bridge.ping();
    await bridge.launchRequest({ kind: "app", id: "launch-streaming-demo" });
    await bridge.setFullscreen(true);
    await bridge.openWebShell({ url: "https://netflix.com", appId: "netflix" });
    await bridge.closeWebShell();

    assert.deepStrictEqual(invoked, [
      CHANNELS.PING,
      CHANNELS.LAUNCH_REQUEST,
      CHANNELS.WINDOW_SET_FULLSCREEN,
      CHANNELS.WEB_SHELL_OPEN,
      CHANNELS.WEB_SHELL_CLOSE,
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
  it("is frozen and stable length (6 legacy + 3 web-shell = 9)", () => {
    assert.ok(Object.isFrozen(ORANGE_TV_BRIDGE_KEYS));
    assert.strictEqual(ORANGE_TV_BRIDGE_KEYS.length, 9);
  });

  it("includes the web-shell bridge methods (SAM-63)", () => {
    assert.ok(ORANGE_TV_BRIDGE_KEYS.includes("openWebShell"));
    assert.ok(ORANGE_TV_BRIDGE_KEYS.includes("closeWebShell"));
    assert.ok(ORANGE_TV_BRIDGE_KEYS.includes("onWebShellState"));
  });
});

describe("web-shell bridge — push channel subscription (SAM-63)", () => {
  it("onWebShellState subscribes on WEB_SHELL_STATE and passes the state payload", () => {
    /** @type {Array<[string, Function]>} */
    const subs = [];
    const ipcRenderer = {
      invoke: () => Promise.resolve(),
      on: (channel, listener) => {
        subs.push([channel, listener]);
      },
      removeListener: (channel, listener) => {
        const i = subs.findIndex((s) => s[0] === channel && s[1] === listener);
        if (i >= 0) subs.splice(i, 1);
      },
    };
    const shellProfile = { getRuntimeMetadataPayload: () => ({}) };
    const bridge = createOrangeTvBridge(ipcRenderer, shellProfile);
    /** @type {unknown[]} */
    const received = [];
    const unsub = bridge.onWebShellState((s) => {
      received.push(s);
    });
    assert.strictEqual(subs.length, 1);
    assert.strictEqual(subs[0][0], CHANNELS.WEB_SHELL_STATE);
    subs[0][1]({}, { open: true, appId: "netflix" });
    assert.deepStrictEqual(received, [{ open: true, appId: "netflix" }]);
    unsub();
    assert.strictEqual(subs.length, 0);
  });
});
