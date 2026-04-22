/// <reference types="vite/client" />

/** Minimal shell metadata when `ORANGETV_ELECTRON__SHELL_PROFILE=appliance`. */
interface OrangeTvRuntimeMetadataAppliance {
  shellProfile: "appliance";
  channel: string;
  /** Feature flag: route streaming tiles to the in-window BrowserView (SAM-61). */
  webShellEnabled: boolean;
}

/** Dev or default profile may include engine versions (no raw Node in non-dev prod). */
interface OrangeTvRuntimeMetadataFull {
  shellProfile: string;
  chrome: string;
  electron: string;
  node?: string;
  /** Feature flag: route streaming tiles to the in-window BrowserView (SAM-61). */
  webShellEnabled: boolean;
}

/** Exposed from `electron/preload.cjs` when running under Electron. */
interface OrangeTvPreload {
  ping: () => Promise<string>;
  launchRequest: (
    payload: { kind: "app"; id: string } | { kind: "media"; mediaItemId: string },
  ) => Promise<{
    ok: boolean;
    reason?: string;
    sessionId?: string;
    pid?: number;
  }>;
  getRuntimeMetadata: () => Promise<OrangeTvRuntimeMetadataAppliance | OrangeTvRuntimeMetadataFull>;
  onShellForeground: (callback: () => void) => () => void;
  setFullscreen: (fullscreen: boolean) => Promise<{ ok: boolean; reason?: string }>;
  /** Bring the Electron shell to the foreground (e.g. after minimizing a child app). */
  focusShell: () => Promise<{ ok: boolean; reason?: string }>;
  /** Open a streaming URL inside an in-window BrowserView (SAM-61). Requires `ORANGETV_ELECTRON__WEB_SHELL_ENABLED=1`. */
  openWebShell: (payload: {
    url: string;
    appId: string;
    chromeProfileSegment?: string | null;
  }) => Promise<{ ok: boolean; reason?: string; appId?: string }>;
  /** Close the active in-window BrowserView and return focus to the shell. */
  closeWebShell: () => Promise<{ ok: boolean; reason?: string }>;
  /** Subscribe to open/close transitions of the in-window BrowserView. Returns unsubscribe. */
  onWebShellState: (
    callback: (state: {
      open: boolean;
      appId: string | null;
      url: string | null;
      partition: string | null;
    }) => void,
  ) => () => void;
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_ORANGETV_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    orangeTv?: OrangeTvPreload;
  }
}

export {};
