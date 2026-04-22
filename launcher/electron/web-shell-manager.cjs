/**
 * In-window BrowserView lifecycle for streaming tiles (SAM-62).
 *
 * The exported `createWebShellManager(deps)` is dependency-injected so the state
 * machine can be driven by `node --test` without pulling in `electron`. Main wires
 * it with the real `BrowserView` / `session` factories in `createRealWebShellDeps`.
 *
 * Contract:
 *   open({ url, appId, chromeProfileSegment? })
 *     → validates URL via web-shell-container.cjs
 *     → resolves partition via web-shell-profile.cjs
 *     → closes any previously open view (only one active at a time)
 *     → creates a BrowserView bound to the shell window content bounds
 *     → installs `before-input-event` key guard (capture Back/Home, forward rest)
 *     → returns { ok: true, appId } or { ok: false, reason }
 *   close()
 *     → detaches + destroys the active view; restores shell focus
 *   dispose()
 *     → close() and stop listening to window resize / close events
 */

const { fullscreenBounds, validateWebShellUrl, classifyWebShellKey } = require("./web-shell-container.cjs");
const { resolveWebShellPartition } = require("./web-shell-profile.cjs");

/**
 * @typedef {{ open: false } | { open: true, appId: string, url: string, partition: string }} WebShellState
 * @typedef {{ open: boolean, appId: string | null, url: string | null, partition: string | null, reason?: string }} WebShellStateEvent
 */

/**
 * @typedef {object} WebShellManagerDeps
 * @property {() => { width: number, height: number } | null} getWindowContentSize
 * @property {() => boolean} isWindowAlive
 * @property {(handler: () => void) => (() => void)} onWindowResize  Returns unsubscribe.
 * @property {(handler: () => void) => (() => void)} onWindowClosed  Returns unsubscribe.
 * @property {(args: { partition: string }) => object} createView     Returns opaque view handle.
 * @property {(view: object, bounds: { x: number, y: number, width: number, height: number }) => void} attachView
 * @property {(view: object, url: string) => Promise<void>} loadUrl
 * @property {(view: object) => void} detachAndDestroyView
 * @property {(view: object, handler: (input: { key: string }) => "capture" | "forward" | "ignore") => (() => void)} installKeyGuard
 * @property {() => void} focusShellWindow
 * @property {(event: WebShellStateEvent) => void} emitState
 * @property {readonly string[] | null} [allowHosts]  Optional host allow-list for validateWebShellUrl.
 */

/**
 * @param {WebShellManagerDeps} deps
 */
function createWebShellManager(deps) {
  /** @type {WebShellState} */
  let state = { open: false };
  /** @type {object | null} */
  let activeView = null;
  /** @type {(() => void)[]} */
  const activeCleanups = [];
  let disposed = false;

  function clearActiveCleanups() {
    while (activeCleanups.length > 0) {
      const c = activeCleanups.pop();
      if (c) {
        try {
          c();
        } catch {
          // best-effort
        }
      }
    }
  }

  function emit() {
    deps.emitState({
      open: state.open,
      appId: state.open ? state.appId : null,
      url: state.open ? state.url : null,
      partition: state.open ? state.partition : null,
    });
  }

  /**
   * @param {{ url: unknown, appId: unknown, chromeProfileSegment?: unknown }} payload
   * @returns {Promise<{ ok: true, appId: string } | { ok: false, reason: string }>}
   */
  async function open(payload) {
    if (disposed) return { ok: false, reason: "manager-disposed" };
    if (!deps.isWindowAlive()) return { ok: false, reason: "no-window" };

    const urlCheck = validateWebShellUrl(
      typeof payload.url === "string" ? payload.url : "",
      deps.allowHosts ?? undefined,
    );
    if (!urlCheck.ok) return { ok: false, reason: urlCheck.reason };

    const partitionCheck = resolveWebShellPartition({
      appId: payload.appId,
      chromeProfileSegment: payload.chromeProfileSegment,
    });
    if (!partitionCheck.ok) return { ok: false, reason: partitionCheck.reason };

    // Only one active web-shell at a time.
    if (state.open) {
      await close();
    }

    const view = deps.createView({ partition: partitionCheck.partition });
    activeView = view;

    const size = deps.getWindowContentSize() ?? { width: 0, height: 0 };
    deps.attachView(view, fullscreenBounds(size));

    const unsubResize = deps.onWindowResize(() => {
      if (!activeView) return;
      const s = deps.getWindowContentSize();
      if (s) {
        try {
          deps.attachView(activeView, fullscreenBounds(s));
        } catch {
          // best-effort; will re-emit on next open if needed
        }
      }
    });
    activeCleanups.push(unsubResize);

    const unsubClosed = deps.onWindowClosed(() => {
      // Window is going away; skip detach (it would throw on a destroyed window).
      activeView = null;
      clearActiveCleanups();
      state = { open: false };
      emit();
    });
    activeCleanups.push(unsubClosed);

    const unsubKeys = deps.installKeyGuard(view, (input) =>
      classifyWebShellKey(typeof input.key === "string" ? input.key : ""),
    );
    activeCleanups.push(unsubKeys);

    state = {
      open: true,
      appId: /** @type {string} */ (payload.appId),
      url: urlCheck.url,
      partition: partitionCheck.partition,
    };
    emit();

    try {
      await deps.loadUrl(view, urlCheck.url);
    } catch (e) {
      await close();
      return {
        ok: false,
        reason: e instanceof Error ? `load-failed:${e.message}` : "load-failed",
      };
    }

    return { ok: true, appId: state.appId };
  }

  async function close() {
    if (!state.open || !activeView) {
      if (state.open) {
        state = { open: false };
        emit();
      }
      return { ok: true };
    }
    try {
      deps.detachAndDestroyView(activeView);
    } catch {
      // best-effort
    }
    activeView = null;
    clearActiveCleanups();
    state = { open: false };
    emit();
    try {
      deps.focusShellWindow();
    } catch {
      // best-effort
    }
    return { ok: true };
  }

  function dispose() {
    disposed = true;
    void close();
  }

  function getState() {
    return state;
  }

  return { open, close, dispose, getState };
}

module.exports = { createWebShellManager };
