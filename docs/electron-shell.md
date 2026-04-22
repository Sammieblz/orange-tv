# Electron shell (launcher runtime)

The TV launcher can run inside **Electron** (`launcher/electron/`). The **main** process owns the window; the **renderer** (Vite/React) is **sandboxed** with **`contextIsolation`** and **no Node integration**.

## Security model

- **Renderer** must not use `require`, `process`, or `ipcRenderer` directly.
- **Preload** ([`launcher/electron/preload.cjs`](../launcher/electron/preload.cjs)) exposes a fixed API on **`window.orangeTv`** via **`contextBridge`** only.
- **Privileged work** (HTTP to the local API for launch, window chrome) runs in **main** behind **`ipcMain.handle`** — never from React.

## Preload API (renderer-facing)

| Method | IPC | Behavior |
| --- | --- | --- |
| **`ping()`** | `orange-tv:ping` | Health check; returns `"pong"`. |
| **`launchRequest(payload)`** | `orange-tv:launch-request` | Validates `payload` in main (`kind` must be **`app`**, **`id`** required — seeded app id). Forwards **`POST /api/v1/launch`** to the local API (see **`ORANGETV_ELECTRON__API_BASE_URL`** in [`environment.md`](environment.md)); returns **`{ ok, sessionId?, pid? }`** or **`{ ok: false, reason }`**. |
| **`getRuntimeMetadata()`** | _(sync in preload)_ | **Appliance** profile: minimal object (`shellProfile`, `channel`). **Dev** / default: includes engine versions; **non-dev** production omits raw **Node** version. |
| **`onShellForeground(cb)`** | `orange-tv:shell-foreground` (main **sends** after window was blurred then focused again) | Subscribe for focus-recovery when returning from an external app; returns unsubscribe. |
| **`setFullscreen(fullscreen)`** | `orange-tv:window-set-fullscreen` | **Main window only:** sets fullscreen on the shell `BrowserWindow`. In **appliance** or **`ORANGETV_ELECTRON__KIOSK`** mode, requests that would **leave** fullscreen are rejected (`kiosk-fullscreen-locked`). |
| **`focusShell()`** | `orange-tv:shell-focus` | Restores (if minimized), **shows**, and **focuses** the launcher window — use after **`POST /api/v1/launch/sessions/{id}/minimize`** so focus returns from Chrome/MPV. |

Invoke-style channels are registered in main; **`SHELL_FOREGROUND`** is **push-only** from main to renderer. All names live in [`launcher/electron/ipc-contract.cjs`](../launcher/electron/ipc-contract.cjs).

## Window lifecycle

See **[electron-window-lifecycle.md](electron-window-lifecycle.md)** for the sequence of **app ready → window creation → load → show → focus/blur**, dev vs appliance/kiosk modes, and **F11** / **IPC fullscreen** toggles.

## Logging and failures

Main logs to **stderr** with prefix **`[OrangeTv:shell]`** and ISO timestamps:

- **`did-finish-load`** (dev only)
- **`did-fail-load`**, **`render-process-gone`**, window **unresponsive** / **responsive**
- **`uncaughtException`** / **`unhandledRejection`** (process exits with code **1**)

If **`loadURL`** / **`loadFile`** fails, the user sees an **error dialog** and the failure is logged.

## Environment

See **[`environment.md`](environment.md)** → *Electron shell (main process)* and [`.env.example`](../.env.example) (export vars from your shell when launching Electron).

## OS-wide lock vs shell lock

**True OS-wide lock** (for example, preventing Alt+Tab or other OS shortcuts from leaving the TV experience) is **not** something Electron alone guarantees. That is an **OS or appliance image** concern: kiosk Linux, Windows assigned access, dedicated hardware remotes, etc. The Orange TV shell can lock **its own** fullscreen/kiosk behavior (see preload `setFullscreen` and [`environment.md`](environment.md)); it does not replace OS-level kiosk policy.

## External apps and launch sessions

Child **Chrome/MPV** windows are **not** part of Electron; the .NET API tracks PIDs and exposes HTTP endpoints for **active sessions**, **minimize**, and **foreground**. **Endpoint list and status codes** live in [`environment.md`](environment.md) → *Local API*; **data model, Win32 behavior, and limitations** in [`launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md). The renderer calls **`focusShell()`** after a successful minimize so the shell regains focus.

## Related docs

- Windows: [`local-setup-windows.md`](local-setup-windows.md) — **Electron shell** section
- Ubuntu: [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md) — **Electron**
- Gamepad + focus checkpoint / shell return: [`gamepad-focus-recovery.md`](gamepad-focus-recovery.md)
