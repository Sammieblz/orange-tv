# Windows local setup and bootstrap smoke test

This document is the **minimum path** to clone, install, run, and verify Orange TV on a Windows development machine. Follow it in order; if something fails, check [Known gaps and limitations](#known-gaps-and-limitations) before guessing.

## Prerequisites

Install these **before** the first run:

| Tool | Purpose | Notes |
| --- | --- | --- |
| **Git** | Clone the repository | Any recent version |
| **Node.js LTS** | Root scripts + `launcher/` (Vite + React) | Includes **npm** |
| **.NET SDK** | `api/` (ASP.NET Core) | Must match or exceed the project’s target (see `api/*.csproj`). Use `dotnet --version` to confirm |
| **PowerShell** | Default terminal on Windows | Commands below assume PowerShell or `cmd` |

**Optional for later features** (not required for the current scaffold smoke test):

- Google Chrome, MPV, FFprobe — referenced in the product plan; the repo skeleton does not launch them yet
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

- **Launcher**: Vite dev server (default **`http://localhost:5173/`**)
- **API**: `dotnet watch` for `api/OrangeTv.Api.csproj` (default **`http://localhost:5144/`** per `api/Properties/launchSettings.json`)

Leave this terminal open. Stop with **Ctrl+C** (stops both processes).

## First-run smoke test checklist

Use this after a clean clone + `npm run setup` + `npm run dev`.

### Launcher (Vite)

- [ ] Terminal shows Vite “ready” and **Local:** `http://localhost:5173/`
- [ ] Browser opens `http://localhost:5173/` and the default Vite + React page loads (no blank error page)
- [ ] DevTools console has **no red uncaught errors** on first load

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
| **No Electron shell yet** | `launcher/` is **Vite + React in the browser**, not the future Electron kiosk window described in the README/plan |
| **Chrome / MPV / FFprobe not wired** | Prerequisites in the README are **forward-looking**; the current API does not spawn Chrome or MPV |
| **Launcher does not call the API by default** | The smoke test verifies **both processes** independently; UI integration is a separate milestone |
| **Two `node_modules` folders** | Root holds orchestration deps (e.g. `concurrently`); `launcher/` holds the frontend app deps |
| **API port** | Default HTTP port is **5144** from `launchSettings.json`; if you change profiles or env vars, update your smoke test URL |
| **Linux / appliance** | This doc is **Windows-only**. Ubuntu VM and mini-PC setup will live in separate docs |

## Quick reference

| Action | Command |
| --- | --- |
| Install | `npm run setup` |
| Dev (launcher + API) | `npm run dev` |
| Lint launcher | `npm --prefix launcher run lint` |
| Format check launcher | `npm --prefix launcher run format:check` |
| Build API | `dotnet build api/OrangeTv.Api.csproj` |

For environment variable naming and examples, see **`docs/environment.md`**.
