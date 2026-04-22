# Orange TV

**Version:** `1.0.0` — declared in [`package.json`](package.json) and [`launcher/package.json`](launcher/package.json).

**Orange TV** is a **Linux-based living-room appliance** that unifies **local media**, **browser-based streaming shortcuts** (persistent sign-in sessions), and **retro gaming** inside a fast, TV-first launcher. A **local** ASP.NET Core service handles orchestration, persistence, and diagnostics—**not** a remote cloud backend.

- **What it is:** a control plane + Electron shell that launches trusted desktop software (**Chrome** and **MPV** today; more app types as the API grows) with **10-foot UI** and a predictable **return-to-home** path after external apps exit or lose focus.
- **What it is not:** a cloud media service, credential vault, or web-automation product. Streaming via Chrome is **best-effort** on Linux; **local media and launcher quality** are the product pillars. Product boundaries and strategy: [`docs/project-plan.md`](docs/project-plan.md).

**Stack (implemented):** **Electron** (narrow preload IPC) + **Vite / React** + **ASP.NET Core Minimal API** — target framework in [`api/OrangeTv.Api.csproj`](api/OrangeTv.Api.csproj) (e.g. **net9.0**) + **SQLite** + background workers. Target appliance: **Ubuntu 24.04**, **Wayland** + **labwc** (see project plan).

## Developer documentation

Read **environment variables, HTTP API list, and BrowserShell** in [`docs/environment.md`](docs/environment.md). **IPC, preload, kiosk lock, and OS-wide lock vs shell lock** in [`docs/electron-shell.md`](docs/electron-shell.md). **Window lifecycle, F11, blur/focus** in [`docs/electron-window-lifecycle.md`](docs/electron-window-lifecycle.md). **Cursor agent: design system + full-stack standards** in [`.cursor/skills/orange-tv-design-system/SKILL.md`](.cursor/skills/orange-tv-design-system/SKILL.md).

| Topic | Doc |
| --- | --- |
| **Setup (Windows / Ubuntu VM)** | [`docs/local-setup-windows.md`](docs/local-setup-windows.md), [`docs/local-setup-ubuntu-vm.md`](docs/local-setup-ubuntu-vm.md) |
| **Launch sessions, minimize/foreground, Win32** | [`docs/launch-sessions-and-windowing.md`](docs/launch-sessions-and-windowing.md) |
| **Linux validation / testing matrix** | [`docs/linux-smoke-checklist.md`](docs/linux-smoke-checklist.md), [`docs/testing-matrix-v1.md`](docs/testing-matrix-v1.md) |
| **Long-form plan, delivery, data model, MVP status** | [`docs/project-plan.md`](docs/project-plan.md) |
| **Focus, gamepad** | [`docs/focus-navigation.md`](docs/focus-navigation.md), [`docs/gamepad-focus-recovery.md`](docs/gamepad-focus-recovery.md) |
| **Chrome profiles, media library, watch history, recommendations** | [`docs/chrome-profiles-and-backup.md`](docs/chrome-profiles-and-backup.md), [`docs/media-library.md`](docs/media-library.md), [`docs/watch-history.md`](docs/watch-history.md), [`docs/recommendations-rules.md`](docs/recommendations-rules.md) |
| **Orange Player + in-shell streaming (roadmap)** | [`docs/player-and-streaming-strategy.md`](docs/player-and-streaming-strategy.md) — Linear epic [SAM-50](https://linear.app/samspot/issue/SAM-50/orange-tv-in-shell-player-streaming-roku-style-ux) |

## Tooling and quality

- **EditorConfig:** [`.editorconfig`](.editorconfig) at repo root.
- **Pre-push / full gate:** `npm run verify` (ESLint, then the same tests as `test:all`). **`npm test`** = .NET only. **`npm run test:all`** = Vitest + Electron `node:test` + `dotnet test` (no lint). Full script table: [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Env templates:** [`.env.example`](.env.example) — see [`docs/environment.md`](docs/environment.md).

## Principles

- Appliance-first: predictable **home** and recovery after external app exit or focus loss; privacy by design (no stored account passwords, no scraping browser cookies for “sign-in detection”).
- **Ubuntu** is the **runtime reference**; validate in a VM or on hardware, not only on Windows.
- Deterministic, explainable behavior before heavy ML; streaming tiles are **shortcuts**, not the only value.

## Product scope (summary)

| In scope (high level) | Out of scope (v1) |
| --- | --- |
| TV launcher, local API, SQLite, launch orchestration, media library, watch history, rules-based rows | Cloud sync, multi-user accounts, ML-first engine, premature automation |

Detail: [`docs/project-plan.md`](docs/project-plan.md) (product boundary).

## Where we develop and validate

| Where | Role | Doc |
| --- | --- | --- |
| **Windows** | Fast inner loop, editors, GPU tooling | [`docs/local-setup-windows.md`](docs/local-setup-windows.md) |
| **Ubuntu (VM, bare metal)** | Linux paths, BrowserShell, Linux smoke checklist | [`docs/local-setup-ubuntu-vm.md`](docs/local-setup-ubuntu-vm.md), [`docs/linux-smoke-checklist.md`](docs/linux-smoke-checklist.md) |
| **Mini PC + TV** | HDMI, thermals, real living-room, final readiness | [`docs/testing-matrix-v1.md`](docs/testing-matrix-v1.md) |

## Architecture

1. **Electron shell** — Fullscreen / kiosk, preload IPC, lifecycle, return-to-home with external processes (see [`docs/electron-shell.md`](docs/electron-shell.md)).
2. **React frontend** — TV layout, focus navigation, gamepad, **Running apps** dock ([`docs/launch-sessions-and-windowing.md`](docs/launch-sessions-and-windowing.md)).
3. **.NET service** — Apps/settings/history, `launch_sessions`, `GET /api/v1/launch/sessions/active`, Win32 minimize/foreground on Windows (501 elsewhere until implemented), `ProcessLaunchService` for spawn/exit, media + recommendations (see `api/`).

**Target OS image (appliance):** Ubuntu 24.04, `labwc`, auto-login, watchdog/recovery per project plan (not the full dev-VM experience).

## Repository structure

```text
orange-tv/
  launcher/        # Electron + Vite + React
  api/             # ASP.NET Core Minimal API
  shared/          # Shared types/contracts
  scripts/         # Dev and tooling
  docs/            # Guides (this README is the entry index)
```

## Stack (libraries)

| Layer | Pieces |
| --- | --- |
| Frontend | Electron, Vite, React, Zustand, TanStack Query, GSAP, CSS Modules, Iconoir |
| Backend | ASP.NET Core, EF Core, SQLite, Serilog, FFprobe, TagLibSharp |
| Platform | Windows (dev), Ubuntu (reference + target), Chrome / MPV for launches |

## Getting started

**Prerequisites:** Node.js LTS, npm, **.NET SDK** matching [`api/OrangeTv.Api.csproj`](api/OrangeTv.Api.csproj), Git. For **`npm run dev`**, install Chromium/Chrome on Linux if you use BrowserShell (see Ubuntu doc). Optional: MPV, FFprobe for full media features.

1. `npm run setup` — root + launcher install, `dotnet restore`, `dotnet tool restore`
2. `npm run dev` — Vite on **http://localhost:5173** + API on **http://localhost:5144** (see `api/Properties/launchSettings.json`, `launcher/vite.config.ts`)
3. Optional: `npm run dev:electron` (run `npm run dev:api` in another terminal; set `ORANGETV_API__BrowserShell__Enabled=false` in `.env` to avoid a second Chrome alongside Electron)
4. Validate on Linux regularly: [`docs/linux-smoke-checklist.md`](docs/linux-smoke-checklist.md)

```bash
npm run setup
npm run dev
# optional: npm run dev:electron
npm run verify          # lint + all tests
npm run design-system  # optional: regenerate design-system docs
```

**Branches / commits / migrations:** [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Operations and recovery (roadmap)

Watchdog, safe mode, OTA/rollback, diagnostics export, backup/restore are **planned** platform capabilities—see **Operations** sections in [`docs/project-plan.md`](docs/project-plan.md).

## Status

An **MVP baseline** is shipped: launcher, local API, Chrome/MPV launch, launch sessions API, running-apps dock, Windows window control for minimize/foreground, kiosk-locked shell behavior. Ongoing: Ubuntu hardening, hardware bring-up, packaging. **MVP detail:** [`docs/project-plan.md`](docs/project-plan.md) (MVP baseline), [`docs/launch-sessions-and-windowing.md`](docs/launch-sessions-and-windowing.md).

---

*Orange TV — built for the couch, not the desktop.*
