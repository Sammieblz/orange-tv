import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * React hook that mirrors the Electron web-shell state (SAM-64).
 *
 * The main process sends `orange-tv:web-shell-state` on open/close transitions via
 * `onWebShellState`. We keep the latest snapshot in a module-level store so any
 * component can reflect "is the in-window BrowserView currently over the launcher?"
 * (for example: dimming the home grid, pausing background animations).
 *
 * Returns `null` when not running under Electron or when the feature flag is off
 * (in those cases the push channel never fires).
 */

export interface WebShellState {
  open: boolean;
  appId: string | null;
  url: string | null;
  partition: string | null;
}

const INITIAL: WebShellState = { open: false, appId: null, url: null, partition: null };

type Listener = () => void;

const listeners = new Set<Listener>();
let currentState: WebShellState = INITIAL;
let subscribed = false;
let unsubscribePreload: (() => void) | null = null;

function emit() {
  for (const l of listeners) l();
}

function ensurePreloadSubscription() {
  if (subscribed) return;
  subscribed = true;
  const api = typeof window !== "undefined" ? window.orangeTv : undefined;
  if (!api?.onWebShellState) return;
  unsubscribePreload = api.onWebShellState((next) => {
    currentState = {
      open: Boolean(next?.open),
      appId: typeof next?.appId === "string" ? next.appId : null,
      url: typeof next?.url === "string" ? next.url : null,
      partition: typeof next?.partition === "string" ? next.partition : null,
    };
    emit();
  });
}

function subscribe(listener: Listener) {
  ensurePreloadSubscription();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      // Keep preload subscription alive; web-shell state is a shell-lifetime concern.
      // Dev-only dispose helper is available via `resetWebShellStateForTests`.
    }
  };
}

function getSnapshot(): WebShellState {
  return currentState;
}

export function useWebShellState(): WebShellState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export interface UseWebShellApi {
  state: WebShellState;
  open: (payload: { url: string; appId: string; chromeProfileSegment?: string | null }) => Promise<{
    ok: boolean;
    reason?: string;
  }>;
  close: () => Promise<{ ok: boolean; reason?: string }>;
}

/** Main hook for components / imperative flows that need to open or close the web shell. */
export function useWebShell(): UseWebShellApi {
  const state = useWebShellState();
  const apiRef = useRef<typeof window.orangeTv | undefined>(
    typeof window !== "undefined" ? window.orangeTv : undefined,
  );

  useEffect(() => {
    apiRef.current = typeof window !== "undefined" ? window.orangeTv : undefined;
  });

  return {
    state,
    open: async (payload) => {
      const api = apiRef.current ?? window.orangeTv;
      if (!api?.openWebShell) return { ok: false, reason: "no-preload" };
      return api.openWebShell(payload);
    },
    close: async () => {
      const api = apiRef.current ?? window.orangeTv;
      if (!api?.closeWebShell) return { ok: false, reason: "no-preload" };
      return api.closeWebShell();
    },
  };
}

/** Test-only helper: reset module-level state between Vitest cases. */
export function resetWebShellStateForTests() {
  currentState = INITIAL;
  if (unsubscribePreload) {
    try {
      unsubscribePreload();
    } catch {
      // best-effort
    }
  }
  unsubscribePreload = null;
  subscribed = false;
}
