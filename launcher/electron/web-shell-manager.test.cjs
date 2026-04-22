const assert = require("node:assert");
const { beforeEach, describe, it } = require("node:test");

const { createWebShellManager } = require("./web-shell-manager.cjs");

/**
 * Factory for fake deps that records every call. Returns deps + an introspection handle.
 */
function makeDeps(overrides = {}) {
  /** @type {object[]} */
  const createdViews = [];
  /** @type {object[]} */
  const destroyedViews = [];
  /** @type {any[]} */
  const attached = [];
  /** @type {Array<{ view: object, url: string }>} */
  const loaded = [];
  /** @type {any[]} */
  const stateEvents = [];
  let focusCalls = 0;
  /** @type {(() => void)[]} */
  const resizeHandlers = [];
  /** @type {(() => void)[]} */
  const closeHandlers = [];
  /** @type {{ width: number, height: number } | null} */
  let windowSize = { width: 1000, height: 800 };
  let windowAlive = true;
  /** @type {Array<(input: { key: string }) => any>} */
  const keyGuards = [];

  const deps = {
    getWindowContentSize: () => windowSize,
    isWindowAlive: () => windowAlive,
    onWindowResize: (h) => {
      resizeHandlers.push(h);
      return () => {
        const i = resizeHandlers.indexOf(h);
        if (i >= 0) resizeHandlers.splice(i, 1);
      };
    },
    onWindowClosed: (h) => {
      closeHandlers.push(h);
      return () => {
        const i = closeHandlers.indexOf(h);
        if (i >= 0) closeHandlers.splice(i, 1);
      };
    },
    createView: ({ partition }) => {
      const v = { id: createdViews.length + 1, partition };
      createdViews.push(v);
      return v;
    },
    attachView: (view, bounds) => {
      attached.push({ view, bounds });
    },
    loadUrl: async (view, url) => {
      loaded.push({ view, url });
    },
    detachAndDestroyView: (view) => {
      destroyedViews.push(view);
    },
    installKeyGuard: (view, handler) => {
      keyGuards.push(handler);
      return () => {
        const i = keyGuards.indexOf(handler);
        if (i >= 0) keyGuards.splice(i, 1);
      };
    },
    focusShellWindow: () => {
      focusCalls += 1;
    },
    emitState: (event) => {
      stateEvents.push(event);
    },
    allowHosts: null,
    ...overrides,
  };

  return {
    deps,
    handle: {
      get createdViews() {
        return createdViews;
      },
      get destroyedViews() {
        return destroyedViews;
      },
      get attached() {
        return attached;
      },
      get loaded() {
        return loaded;
      },
      get stateEvents() {
        return stateEvents;
      },
      get focusCalls() {
        return focusCalls;
      },
      get resizeHandlers() {
        return resizeHandlers;
      },
      get closeHandlers() {
        return closeHandlers;
      },
      get keyGuards() {
        return keyGuards;
      },
      setWindowSize(next) {
        windowSize = next;
      },
      setWindowAlive(next) {
        windowAlive = next;
      },
    },
  };
}

const VALID = {
  url: "https://www.netflix.com/browse",
  appId: "netflix",
};

describe("createWebShellManager — happy path", () => {
  let deps;
  let handle;
  let mgr;
  beforeEach(() => {
    const made = makeDeps();
    deps = made.deps;
    handle = made.handle;
    mgr = createWebShellManager(deps);
  });

  it("starts in a closed state and emits nothing until open", () => {
    assert.deepStrictEqual(mgr.getState(), { open: false });
    assert.strictEqual(handle.stateEvents.length, 0);
  });

  it("opens, creates a view with persist partition, attaches bounds, loads url, emits state", async () => {
    const r = await mgr.open(VALID);
    assert.deepStrictEqual(r, { ok: true, appId: "netflix" });
    assert.strictEqual(handle.createdViews.length, 1);
    assert.strictEqual(handle.createdViews[0].partition, "persist:netflix");
    assert.strictEqual(handle.attached.length, 1);
    assert.deepStrictEqual(handle.attached[0].bounds, { x: 0, y: 0, width: 1000, height: 800 });
    assert.strictEqual(handle.loaded.length, 1);
    assert.strictEqual(handle.loaded[0].url, "https://www.netflix.com/browse");
    const lastEvent = handle.stateEvents[handle.stateEvents.length - 1];
    assert.strictEqual(lastEvent.open, true);
    assert.strictEqual(lastEvent.appId, "netflix");
  });

  it("uses chromeProfileSegment for the partition when provided (shared sign-in)", async () => {
    await mgr.open({ ...VALID, chromeProfileSegment: "shared" });
    assert.strictEqual(handle.createdViews[0].partition, "persist:shared");
  });

  it("closes the view, destroys it, emits closed state, and refocuses the shell window", async () => {
    await mgr.open(VALID);
    const focusBefore = handle.focusCalls;
    await mgr.close();
    assert.strictEqual(handle.destroyedViews.length, 1);
    const last = handle.stateEvents[handle.stateEvents.length - 1];
    assert.strictEqual(last.open, false);
    assert.strictEqual(handle.focusCalls, focusBefore + 1);
    assert.deepStrictEqual(mgr.getState(), { open: false });
  });

  it("only allows one active web-shell at a time (previous is closed on open)", async () => {
    await mgr.open(VALID);
    await mgr.open({ url: "https://www.primevideo.com", appId: "prime-video" });
    assert.strictEqual(handle.destroyedViews.length, 1);
    assert.strictEqual(handle.createdViews.length, 2);
    assert.strictEqual(mgr.getState().open, true);
    assert.strictEqual(mgr.getState().appId, "prime-video");
  });

  it("updates bounds on window resize while the view is attached", async () => {
    await mgr.open(VALID);
    handle.setWindowSize({ width: 1920, height: 1080 });
    handle.resizeHandlers[0]();
    assert.strictEqual(handle.attached.length, 2);
    assert.deepStrictEqual(handle.attached[1].bounds, { x: 0, y: 0, width: 1920, height: 1080 });
  });

  it("handles window closed: marks state closed without calling destroy (window is gone)", async () => {
    await mgr.open(VALID);
    const destroyedBefore = handle.destroyedViews.length;
    handle.closeHandlers[0]();
    assert.strictEqual(handle.destroyedViews.length, destroyedBefore);
    assert.deepStrictEqual(mgr.getState(), { open: false });
    const last = handle.stateEvents[handle.stateEvents.length - 1];
    assert.strictEqual(last.open, false);
  });

  it("installs a key guard that consults classifyWebShellKey (Escape = capture, ArrowRight = forward)", async () => {
    await mgr.open(VALID);
    const guard = handle.keyGuards[0];
    assert.strictEqual(guard({ key: "Escape" }), "capture");
    assert.strictEqual(guard({ key: "ArrowRight" }), "forward");
    assert.strictEqual(guard({ key: "" }), "ignore");
  });
});

describe("createWebShellManager — error paths", () => {
  it("rejects http/invalid URLs without creating a view", async () => {
    const { deps, handle } = makeDeps();
    const mgr = createWebShellManager(deps);
    const r = await mgr.open({ url: "http://example.com", appId: "x" });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(handle.createdViews.length, 0);
    assert.strictEqual(handle.stateEvents.length, 0);
  });

  it("rejects when appId + segment are missing (partition cannot be resolved)", async () => {
    const { deps } = makeDeps();
    const mgr = createWebShellManager(deps);
    const r = await mgr.open({ url: "https://netflix.com", appId: "" });
    assert.strictEqual(r.ok, false);
  });

  it("returns no-window when the shell window is already destroyed", async () => {
    const { deps, handle } = makeDeps();
    handle.setWindowAlive(false);
    const mgr = createWebShellManager(deps);
    const r = await mgr.open(VALID);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, "no-window");
  });

  it("enforces host allow-list when provided", async () => {
    const { deps } = makeDeps({ allowHosts: ["netflix.com"] });
    const mgr = createWebShellManager(deps);
    const bad = await mgr.open({ url: "https://example.com", appId: "example" });
    assert.strictEqual(bad.ok, false);
    assert.strictEqual(bad.reason, "host-not-allowed");
    const good = await mgr.open({ url: "https://www.netflix.com/browse", appId: "netflix" });
    assert.strictEqual(good.ok, true);
  });

  it("rolls back when loadUrl throws (destroys the view + restores closed state)", async () => {
    const { deps, handle } = makeDeps({
      loadUrl: async () => {
        throw new Error("offline");
      },
    });
    const mgr = createWebShellManager(deps);
    const r = await mgr.open(VALID);
    assert.strictEqual(r.ok, false);
    assert.ok(String(r.reason).startsWith("load-failed"));
    assert.strictEqual(handle.destroyedViews.length, 1);
    assert.deepStrictEqual(mgr.getState(), { open: false });
  });
});

describe("createWebShellManager — dispose", () => {
  it("dispose closes and prevents subsequent opens", async () => {
    const { deps, handle } = makeDeps();
    const mgr = createWebShellManager(deps);
    await mgr.open(VALID);
    mgr.dispose();
    const r = await mgr.open(VALID);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, "manager-disposed");
    assert.ok(handle.destroyedViews.length >= 1);
  });
});
