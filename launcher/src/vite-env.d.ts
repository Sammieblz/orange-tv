/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORANGETV_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Exposed from `electron/preload.cjs` when running under Electron. */
interface OrangeTvPreload {
  ping: () => Promise<string>;
  launchRequest: (payload: unknown) => Promise<{ ok: boolean; reason?: string }>;
  versions: { node: string; chrome: string; electron: string };
}

declare global {
  interface Window {
    orangeTv?: OrangeTvPreload;
  }
}
