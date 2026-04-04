/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORANGETV_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Minimal shell metadata when `ORANGETV_ELECTRON__SHELL_PROFILE=appliance`. */
interface OrangeTvRuntimeMetadataAppliance {
  shellProfile: "appliance";
  channel: string;
}

/** Dev or default profile may include engine versions (no raw Node in non-dev prod). */
interface OrangeTvRuntimeMetadataFull {
  shellProfile: string;
  chrome: string;
  electron: string;
  node?: string;
}

/** Exposed from `electron/preload.cjs` when running under Electron. */
interface OrangeTvPreload {
  ping: () => Promise<string>;
  launchRequest: (payload: unknown) => Promise<{ ok: boolean; reason?: string }>;
  getRuntimeMetadata: () => Promise<OrangeTvRuntimeMetadataAppliance | OrangeTvRuntimeMetadataFull>;
}

declare global {
  interface Window {
    orangeTv?: OrangeTvPreload;
  }
}
