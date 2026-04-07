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

### BrowserShell and Electron

When you run **`npm run dev:electron`**, you usually want **one** shell window. Set **`ORANGETV_API__BrowserShell__Enabled=false`** in `.env` while the API is up so it does not auto-open Chrome in addition to Electron. Default **`npm run dev`** keeps BrowserShell **enabled** so a Chromium window opens after Vite is ready.

When starting **Electron** from a shell, you can override the dev URL with **`VITE_DEV_SERVER_URL`** (read by **`launcher/electron/main.cjs`** from the process environment — it is **not** supplied via Vite’s `import.meta.env`).

### Electron shell (main process)

These are read by **`launcher/electron/main.cjs`** and **`launcher/electron/preload.cjs`** from **`process.env`**. They are **not** injected from `.env` automatically unless your shell or tooling exports them (Node does not load repo `.env` for `npm run electron` unless you add something like `dotenv-cli`).

| Variable | Purpose |
| --- | --- |
| **`ELECTRON_IS_DEV`** | Set to **`1`** by **`npm run electron`** (dev URL load). Unset for **`electron:prod`** (`dist/index.html`). |
| **`ORANGETV_ELECTRON__SHELL_PROFILE`** | **`appliance`**: fullscreen shell, minimal metadata exposed to renderer via preload. Omit / other: windowed (dev-sized) or centered window for production builds on desktop. |
| **`ORANGETV_ELECTRON__KIOSK`** | **`1`** / **`true`**: enable Electron **`kiosk`** (stricter than fullscreen alone). |
| **`ORANGETV_ELECTRON__OPEN_DEVTOOLS`** | **`1`** / **`true`**: open DevTools when **`ELECTRON_IS_DEV`** is set and profile is **not** appliance. |

**Fullscreen toggles (not env vars):** In dev (non-appliance), the main process registers **F11** to toggle fullscreen. The preload API **`window.orangeTv.setFullscreen(boolean)`** invokes **`orange-tv:window-set-fullscreen`**. See [`electron-window-lifecycle.md`](electron-window-lifecycle.md).

**Shell logs:** main-process diagnostics use the prefix **`[OrangeTv:shell]`** on **stderr** (load failures, render-process-gone, unhandled errors). See [`electron-shell.md`](electron-shell.md).

## Paths (Windows + Linux)

When documenting paths:

- Prefer **forward slashes** in docs and examples (`C:/Users/...`) since they also work well with many cross-platform tools.
- For Linux appliance targets, keep persistent data in a documented app directory (e.g. `/var/lib/orange-tv/`).

### Ubuntu (and most desktop Linux)

- **BrowserShell executable:** set **`ORANGETV_API__BrowserShell__ExecutablePath`** if Chromium/Chrome is not discovered automatically (e.g. `/usr/bin/chromium`, `/usr/bin/google-chrome-stable`). See [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md).
- **Dev profile / shell state:** the API stores BrowserShell data under the .NET local application data folder, which on Linux usually follows **XDG** (often **`~/.local/share/OrangeTv/`**). Use this when clearing a stuck dev profile.

## Source of truth

- See `.env.example` for current variable examples.
- For backend defaults, `.NET` launch settings may also define ports/URLs during development.
