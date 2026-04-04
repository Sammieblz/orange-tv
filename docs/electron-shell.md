# Electron shell (launcher runtime)

The TV launcher can run inside **Electron** (`launcher/electron/`). The **main** process owns the window; the **renderer** (Vite/React) is **sandboxed** with **`contextIsolation`** and **no Node integration**.

## Security model

- **Renderer** must not use `require`, `process`, or `ipcRenderer` directly.
- **Preload** ([`launcher/electron/preload.cjs`](../launcher/electron/preload.cjs)) exposes a fixed API on **`window.orangeTv`** via **`contextBridge`** only.
- **Privileged work** (future HTTP to the local API, process launch) runs in **main** behind **`ipcMain.handle`** — never from React.

## Preload API (renderer-facing)

| Method | IPC | Behavior |
| --- | --- | --- |
| **`ping()`** | `orange-tv:ping` | Health check; returns `"pong"`. |
| **`launchRequest(payload)`** | `orange-tv:launch-request` | Validates `payload` in main (`kind` string, optional `id` string). Currently returns **`not-implemented`** after logging; reserved for forwarding to the .NET service. |
| **`getRuntimeMetadata()`** | _(sync in preload)_ | **Appliance** profile: minimal object (`shellProfile`, `channel`). **Dev** / default: includes engine versions; **non-dev** production omits raw **Node** version. |

Channel names are defined once in [`launcher/electron/ipc-contract.cjs`](../launcher/electron/ipc-contract.cjs).

## Logging and failures

Main logs to **stderr** with prefix **`[OrangeTv:shell]`** and ISO timestamps:

- **`did-finish-load`** (dev only)
- **`did-fail-load`**, **`render-process-gone`**, window **unresponsive** / **responsive**
- **`uncaughtException`** / **`unhandledRejection`** (process exits with code **1**)

If **`loadURL`** / **`loadFile`** fails, the user sees an **error dialog** and the failure is logged.

## Environment

See **[`environment.md`](environment.md)** → *Electron shell (main process)* and [`.env.example`](../.env.example) (export vars from your shell when launching Electron).

## Related docs

- Windows: [`local-setup-windows.md`](local-setup-windows.md) — **Electron shell** section
- Ubuntu: [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md) — **Electron**
