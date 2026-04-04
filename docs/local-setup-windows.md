# Windows local setup and bootstrap smoke test

This document is the **minimum path** to clone, install, run, and verify Orange TV on a **Windows** development machine. The **target appliance OS** is **Ubuntu**; for running the stack on Ubuntu (VM, bare metal, or hardware), use [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md).

Follow this page in order; if something fails, check [Known gaps and limitations](#known-gaps-and-limitations) before guessing.

## Prerequisites

Install these **before** the first run:

| Tool | Purpose | Notes |
| --- | --- | --- |
| **Git** | Clone the repository | Any recent version |
| **Node.js LTS** | Root scripts + `launcher/` (Vite + React) | Includes **npm** |
| **.NET SDK** | `api/` (ASP.NET Core) | Must match or exceed the project’s target (see `api/*.csproj`). Use `dotnet --version` to confirm |
| **PowerShell** | Default terminal on Windows | Commands below assume PowerShell or `cmd` |

**Optional for later features** (not required for the current scaffold smoke test):

- **Google Chrome** — optional as a manual browser; in **`npm run dev`**, the API may **auto-open** Chrome for the launcher URL via **BrowserShell** (see [Run the app](#run-the-app-development))
- **MPV, FFprobe** — referenced in the product plan; playback orchestration is not wired in the scaffold yet
- Visual Studio 2022 — optional; you can use VS Code or the CLI

**Trust HTTPS dev certificate (optional):** If you switch the API to HTTPS profiles, run `dotnet dev-certs https --trust` once. The default dev flow uses HTTP on port **5144**.

## Clone and install

1. **Clone** the repository to a path without spaces if you want fewer edge cases (spaces usually work):

   ```powershell
   git clone <your-repo-url> orange-tv
   cd orange-tv
   ```

2. **Install dependencies** from the **repository root** (installs root tooling, `launcher/` packages, and restores the API):

   ```powershell
   npm run setup
   ```

   Equivalent manual steps:

   ```powershell
   npm install
   npm --prefix launcher install
   dotnet restore api/OrangeTv.Api.csproj
   ```

## Run the app (development)

From the **repository root**:

```powershell
npm run dev
```

This starts:

- **Launcher**: Vite dev server. It listens on **`127.0.0.1:5173`** (see `launcher/vite.config.ts`); open **`http://localhost:5173/`** or **`http://127.0.0.1:5173/`** — both work on a typical Windows hosts file.
- **API**: `dotnet watch` for `api/OrangeTv.Api.csproj` — default **`http://localhost:5144/`** (see `api/Properties/launchSettings.json`).
- **Shell**: the API will auto-launch the launcher in a Chromium/Chrome app window once the Vite URL is reachable (unless **BrowserShell** is disabled in `.env`).

Leave this terminal open. Stop with **Ctrl+C** (stops both processes).

### Electron shell (optional)

Use this when you want the **Electron** window instead of (or in addition to) the API’s Chromium app launch:

1. Set **`ORANGETV_API__BrowserShell__Enabled=false`** in `.env` or your environment so the API does not auto-open Chrome while you use Electron. If you skip this, you will still see a **Chrome** window from the API; that is not Electron.
2. Start the **API** in one terminal: `npm run dev:api` (or keep `npm run dev` and ignore the extra browser, but disabling BrowserShell avoids duplicate shells).
3. In another terminal, from the repo root: **`npm run dev:electron`**.

That runs **Vite** on **5173** (same host binding as above) and then **Electron**. You should see both **`[vite]`** and **`[electron]`** prefixes in the terminal; if only `[vite]` appears, see [Troubleshooting](#troubleshooting) below.

Electron loads the dev URL (`http://localhost:5173` by default; overridable with **`VITE_DEV_SERVER_URL`** when starting Electron).

**Production-style Electron (built assets):** from the repo root, `npm --prefix launcher run build`, then:

```powershell
cd launcher
npm run electron:prod
```

**`electron:prod`** does **not** set **`ELECTRON_IS_DEV`**, so Electron loads **`dist/index.html`**. The **`npm run electron`** script is for **dev URL** loads only. The API must still be running separately if the UI calls it.

**Fullscreen / appliance-style Electron:** set main-process env vars when launching (they are **not** read from `.env` unless you export them). Example in PowerShell before **`npm run dev:electron`** or from **`launcher/`** for **`npm run electron`**:

```powershell
$env:ORANGETV_ELECTRON__SHELL_PROFILE = "appliance"
# Optional stricter kiosk:
# $env:ORANGETV_ELECTRON__KIOSK = "1"
```

See [`environment.md`](environment.md) and [`electron-shell.md`](electron-shell.md).

**Linux validation** is a separate step: clone the repo **inside** your Ubuntu VM, `git pull`, and run **`npm run dev`** there — see [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md).

## Troubleshooting

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| **Chrome opens** but **no Electron window** when using **`npm run dev:electron`** | You are seeing **BrowserShell** from **`npm run dev:api`**, not Electron | Set **`ORANGETV_API__BrowserShell__Enabled=false`** in `.env` and restart the API |
| **`npm run dev:electron`** shows only **`[vite]`**, never **`[electron]`** | **`wait-on`** never saw the dev server (older setups probed **`127.0.0.1`** while Vite listened only on IPv6) | Use current `launcher/` (Vite **`host: 127.0.0.1`** + **`wait-on http-get://127.0.0.1:5173`**). Stop the command and run **`npm run dev:electron`** again |
| **Port 5173 already in use** | Another Vite or process holds the port | Stop the other process, or temporarily change **`server.port`** in `launcher/vite.config.ts` and align **CORS** origins in `api/Program.cs` if you change the launcher origin |
| **API footer shows error** | API not running or wrong base URL | Start **`npm run dev:api`** (or **`npm run dev`**). Set **`VITE_ORANGETV_API_BASE_URL`** in `.env` if the API is not on **`http://localhost:5144`** |
| **Electron shell issues / logging** | Need IPC or env reference | See [`electron-shell.md`](electron-shell.md); shell diagnostics on **stderr** with **`[OrangeTv:shell]`** |

## First-run smoke test checklist

Use this after a clean clone + `npm run setup` + `npm run dev`.

### Launcher (Vite)

- [ ] Terminal shows Vite “ready” and **Local:** `http://localhost:5173/`
- [ ] Chromium/Chrome opens automatically and the launcher page loads (no blank error page), **or** you use `npm run dev:electron` with BrowserShell disabled
- [ ] DevTools console has **no red uncaught errors** on first load
- [ ] Footer **API** strip shows **connected** when the API is up (launcher calls `GET /api/v1/system/platform` cross-origin)
- [ ] **Keyboard:** arrows move logical focus (sidebar, hero, tile rows); **Enter** logs activation; **Escape** from hero/rows returns to sidebar — see [`focus-navigation.md`](focus-navigation.md)

### API (ASP.NET Core)

- [ ] Terminal shows **Now listening on:** `http://localhost:5144` (or the URL from your `launchSettings.json` if you changed it)
- [ ] **GET** `http://localhost:5144/weatherforecast` returns **HTTP 200** and a JSON array

  PowerShell example:

  ```powershell
  (Invoke-WebRequest -UseBasicParsing 'http://localhost:5144/weatherforecast').StatusCode
  ```

  Expected: `200`

- [ ] Optional: **GET** `http://localhost:5144/api/v1/system/platform` returns **HTTP 200** and JSON including `isWindows` and `isLinux` (verifies the injectable platform boundary used for OS-aware behavior)

### Monorepo sanity

- [ ] `npm run setup` completed without errors
- [ ] `dotnet build api/OrangeTv.Api.csproj` succeeds (optional extra check)

## Environment overrides (optional)

- Copy **`.env.example`** to **`.env`** at the repo root if you need local overrides (see `docs/environment.md`).
- The scaffold does not require a `.env` file for the smoke test above.

## Known gaps and limitations

These are **intentional** at this stage; they are listed so you do not assume missing behavior is a bad install.

| Gap | What it means |
| --- | --- |
| **Electron is optional** | **`npm run dev:electron`** runs Vite + Electron concurrently; default **`npm run dev`** still uses the Chromium **BrowserShell** from the API unless you disable it |
| **Browser shell dependency** | Auto-launch prefers `chromium-browser` / `chromium` / Chrome on PATH; set `ORANGETV_API__BrowserShell__ExecutablePath` if your browser lives elsewhere |
| **Chrome / MPV / FFprobe not wired** | Prerequisites in the README are **forward-looking**; the current API does not spawn Chrome or MPV |
| **Launcher API usage** | The home grid stays **seeded**; the footer status row uses TanStack Query to reach the API when CORS allows (Development policy includes `localhost:5173`) |
| **Two `node_modules` folders** | Root holds orchestration deps (e.g. `concurrently`); `launcher/` holds the frontend app deps |
| **API port** | Default HTTP port is **5144** from `launchSettings.json`; if you change profiles or env vars, update your smoke test URL |
| **Linux / appliance** | Use **[`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md)** for Ubuntu; this file stays **Windows-only** |

## Quick reference

| Action | Command |
| --- | --- |
| Install | `npm run setup` |
| Dev (launcher + API) | `npm run dev` |
| Dev (Vite + Electron; API separate) | `npm run dev:electron` — start **`npm run dev:api`** in another terminal; set **`ORANGETV_API__BrowserShell__Enabled=false`** to avoid an extra Chrome window |
| Design system regen (optional) | `npm run design-system` (needs Python + local ui-ux-pro-max skill; see `scripts/README.md`) |
| Lint launcher | `npm --prefix launcher run lint` |
| Format check launcher | `npm --prefix launcher run format:check` |
| Build launcher (web assets) | `npm --prefix launcher run build` |
| Electron against **built** `dist/` | After build: `cd launcher` then `npm run electron:prod` |
| Build API | `dotnet build api/OrangeTv.Api.csproj` |

For environment variable naming and examples, see **`docs/environment.md`**.
