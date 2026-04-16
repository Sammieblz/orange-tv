# Environment conventions

This repo uses simple, explicit environment-variable conventions so local dev is reproducible on Windows and Linux.

## Files and naming

- **Do not commit** `.env` files.
- Commit only **example templates** like `.env.example`.

Recommended workflow:

1. Copy `.env.example` to `.env` (optional; only if you need overrides).
2. Override values locally without changing tracked files.

## Frontend (Vite) conventions

Vite only exposes variables to the browser when they are prefixed with `VITE_`.

- **Prefix**: `VITE_ORANGETV_...`
- **Example**:
  - `VITE_ORANGETV_API_BASE_URL=http://localhost:5144`

## Backend (.NET) conventions

ASP.NET Core supports hierarchical configuration via environment variables using **double underscores** (`__`) to represent nesting.

- **Prefix**: `ORANGETV_API__...`
- **Pattern**: `ORANGETV_API__Section__Key=value`

Examples:

- `ORANGETV_API__Data__SqlitePath=C:/path/to/orange-tv.db`
- `ORANGETV_API__Features__EnableDiagnostics=true`
- `ORANGETV_API__BrowserShell__Enabled=false`
- `ORANGETV_API__BrowserShell__ExecutablePath=/usr/bin/chromium-browser`
- `ORANGETV_API__Launch__ChromeProfilesRoot=C:/OrangeTvProfiles` — optional default **parent** directory for Chrome **`--user-data-dir`** segment folders when the **`launcher.chrome.profilesRoot`** setting is unset (see [`chrome-profiles-and-backup.md`](chrome-profiles-and-backup.md)).
- **`ORANGETV_API__Library__Enabled`** — `true` to run the local media scanner and **FileSystemWatcher** debounced rescans (requires **ffprobe**/**ffmpeg** on `PATH` for full metadata and thumbnails). See [`media-library.md`](media-library.md).

### BrowserShell and Electron

When you run **`npm run dev:electron`**, you usually want **one** shell window. Set **`ORANGETV_API__BrowserShell__Enabled=false`** in `.env` while the API is up so it does not auto-open Chrome in addition to Electron. Default **`npm run dev`** keeps BrowserShell **enabled** so a Chromium window opens after Vite is ready.

When starting **Electron** from a shell, you can override the dev URL with **`VITE_DEV_SERVER_URL`** (read by **`launcher/electron/main.cjs`** from the process environment — it is **not** supplied via Vite’s `import.meta.env`).

### Electron shell (main process)

These are read by **`launcher/electron/main.cjs`** and **`launcher/electron/preload.cjs`** from **`process.env`**. They are **not** injected from `.env` automatically unless your shell or tooling exports them (Node does not load repo `.env` for `npm run electron` unless you add something like `dotenv-cli`).

| Variable | Purpose |
| --- | --- |
| **`ELECTRON_IS_DEV`** | Set to **`1`** by **`npm run electron`** (dev URL load). Unset for **`electron:prod`** (`dist/index.html`). |
| **`ORANGETV_ELECTRON__SHELL_PROFILE`** | **`appliance`**: fullscreen shell, minimal metadata exposed to renderer via preload. Omit / other: windowed (dev-sized) or centered window for production builds on desktop. Appliance (or **`ORANGETV_ELECTRON__KIOSK`**) also **locks** the shell: **`setFullScreenable(false)`**, renderer cannot turn fullscreen **off** via IPC, and the dev **F11** shortcut is disabled. |
| **`ORANGETV_ELECTRON__KIOSK`** | **`1`** / **`true`**: enable Electron **`kiosk`** (stricter than fullscreen alone) and treat the shell as **kiosk-locked** (same IPC / F11 behavior as appliance for locking). |
| **`ORANGETV_ELECTRON__OPEN_DEVTOOLS`** | **`1`** / **`true`**: open DevTools when **`ELECTRON_IS_DEV`** is set and profile is **not** appliance. |
| **`ORANGETV_ELECTRON__API_BASE_URL`** | Base URL for the local .NET API (no trailing slash). Main uses this for **`POST /api/v1/launch`** when the renderer calls **`window.orangeTv.launchRequest`**. Defaults to **`http://localhost:5144`** when unset. |

**Fullscreen toggles (not env vars):** In dev, when the shell is **not** kiosk-locked, the main process registers **F11** to toggle fullscreen. The preload API **`window.orangeTv.setFullscreen(boolean)`** invokes **`orange-tv:window-set-fullscreen`**. See [`electron-window-lifecycle.md`](electron-window-lifecycle.md).

**Shell logs:** main-process diagnostics use the prefix **`[OrangeTv:shell]`** on **stderr** (load failures, render-process-gone, unhandled errors). See [`electron-shell.md`](electron-shell.md).

## Paths (Windows + Linux)

When documenting paths:

- Prefer **forward slashes** in docs and examples (`C:/Users/...`) since they also work well with many cross-platform tools.
- For Linux appliance targets, keep persistent data in a documented app directory (e.g. `/var/lib/orange-tv/`).

### Ubuntu (and most desktop Linux)

- **BrowserShell executable:** set **`ORANGETV_API__BrowserShell__ExecutablePath`** if Chromium/Chrome is not discovered automatically (e.g. `/usr/bin/chromium`, `/usr/bin/google-chrome-stable`). See [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md).
- **Dev profile / shell state:** the API stores BrowserShell data under the .NET local application data folder, which on Linux usually follows **XDG** (often **`~/.local/share/OrangeTv/`**). Use this when clearing a stuck dev profile.

## Local API (control plane)

With the API running (default `http://localhost:5144`), baseline endpoints include:

- `GET /api/v1/health` — SQLite connectivity and service status.
- `GET` / `PUT /api/v1/settings` — persisted key/value settings (`PUT /api/v1/settings/{key}` with JSON `{ "value": "..." }`).
- `GET /api/v1/apps` — launcher catalog rows (seeded when the database is empty), including Chrome session hints (`sessionFreshness`, etc.).
- `PUT /api/v1/apps/{appId}/session-freshness` — JSON `{ "freshness": "PossiblyStale" }` (enum names: `Unknown`, `LikelyActive`, `PossiblyStale`, `ResetSuggested`) for operator overrides without touching profile files.
- `GET /api/v1/media/items` — paginated indexed local files (`skip` / `take`).
- `POST /api/v1/media/library/scan` — trigger asynchronous full library rescan (`202 Accepted`).
- `POST /api/v1/launch` — JSON `{ "appId": "<id>" }` to spawn Chrome or MPV (see seeded apps in `api/Data/DbSeeder.cs`).
- `GET /api/v1/launch/sessions/active` — active child sessions (not ended) with app labels for the launcher dock.
- `POST /api/v1/launch/sessions/{sessionId}/minimize` / `.../foreground` — Windows: Win32 window minimize / restore+focus for the session PID; other OS: **501** until a platform backend exists.

Deep dive: [`launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md).

**Notes (launcher dock and session APIs):**

- **OS-wide lock:** True OS-wide lock (for example, no Alt+Tab) is **not** what Electron alone guarantees; that is an **OS / appliance image** concern (kiosk Linux, assigned access, etc.). See [`electron-shell.md`](electron-shell.md) → *OS-wide lock vs shell lock*.
- **Linux / macOS minimize & foreground:** Those endpoints return **501** until a non-Windows implementation exists; the dock can still list **active sessions** from **`GET /api/v1/launch/sessions/active`** (data from the API).

**Chrome profiles:** the **`launcher.chrome.profilesRoot`** setting (via **`PUT /api/v1/settings/launcher.chrome.profilesRoot`**) overrides the env default for where profile segment folders live. Backup and DB-vs-profile confusion are documented in [`chrome-profiles-and-backup.md`](chrome-profiles-and-backup.md).

**MPV sample file (dev):** when the seeded MPV app has no `LaunchUrl`, the API reads **`ORANGETV_API__Launch__SampleMediaPath`** (see `api/Configuration/OrangetvApiOptions.cs`). Point it at a real media file on your machine; leave unset in CI.

The SQLite file defaults to `%LOCALAPPDATA%\OrangeTv\orange-tv.db` on Windows when `ORANGETV_API__Data__SqlitePath` is unset (see `.env.example`). That file is **not** the Chrome profile tree; do not delete profile directories when you only mean to reset the database.

## Source of truth

- See `.env.example` for current variable examples.
- For backend defaults, `.NET` launch settings may also define ports/URLs during development.
