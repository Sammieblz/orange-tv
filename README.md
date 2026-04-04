# Orange TV

Orange TV is a TV-first launcher and local media platform designed for a living-room experience.

It combines an Electron shell, a React-based TV UI, and a local host service backed by SQLite to deliver a fast launcher experience for streaming shortcuts with persistent sessions, local media playback, and retro gaming — with an appliance-grade focus on recovery and return-to-home behavior.

## Full-scope plan (v1.2)

The detailed architecture, OS/session baseline, operations plane, data model, and delivery sequencing live here:

- `docs/project-plan-v1.2.md`

## Config, lint/format, and env conventions

- **EditorConfig**: `.editorconfig` (repo-wide formatting baseline)
- **Frontend lint/format** (`launcher/`):
  - `npm --prefix launcher run lint`
  - `npm --prefix launcher run format:check`
- **Environment variables**:
  - Examples: `.env.example`
  - Documentation: `docs/environment.md`

## Vision

Orange TV aims to feel like a dedicated home entertainment appliance rather than a traditional desktop app.

## Core goals

- Fast, TV-friendly fullscreen launcher
- Smooth keyboard and controller navigation
- Local service for app launching, settings, history, and media scanning
- Local media playback with resume support
- Persistent Chrome profile sessions for streaming shortcuts
- Windows-first development, Ubuntu validation, and later mini-PC deployment

## Current delivery strategy

Development is happening in three stages:

### Windows development workstation

- Common choice for editors and GPU tooling
- Same `npm` / `dotnet` commands as Ubuntu

### Ubuntu (VM, bare metal, mini PC)

- **Runtime reference** for the appliance and Linux behavior
- Use [`docs/local-setup-ubuntu-vm.md`](docs/local-setup-ubuntu-vm.md) for Chromium/BrowserShell, paths, and headless notes
- **End-of-sprint gate:** [`docs/linux-smoke-checklist.md`](docs/linux-smoke-checklist.md)
- **Cross-environment expectations (v1):** [`docs/testing-matrix-v1.md`](docs/testing-matrix-v1.md)

### Target mini PC hardware

- Final appliance target
- Used for HDMI/display validation, performance checks, thermals, and real living-room testing

## Architecture

Orange TV is built from three main layers:

### 1. Electron shell

Responsible for:

- Fullscreen launcher window
- Kiosk-style runtime behavior
- Secure preload bridge
- Shell lifecycle and crash handling
- Returning focus after child processes exit

### 2. React frontend

Responsible for:

- TV UI layout
- Sidebar, hero, rows, and tiles
- Focus-based navigation
- Keyboard and gamepad input handling
- Rendering launcher data from the local API

### 3. Local .NET service

Responsible for:

- Apps/settings/history APIs
- SQLite persistence
- Launch orchestration for Chrome and MPV
- Media scanning and metadata ingestion
- Watch events and recommendation baselines

## OS + session baseline (target appliance)

- Ubuntu 24.04 LTS appliance image
- Wayland session with `labwc`
- Auto-login into the appliance account and start Orange TV on boot
- Watchdog/recovery behavior treated as core, not late polish

## Planned stack

### Frontend

- Electron
- Vite
- React
- Zustand
- TanStack Query
- GSAP
- CSS Modules + CSS variables
- Iconoir icons

### Backend

- .NET local API
- Entity Framework Core
- SQLite
- Background workers
- FFprobe
- TagLibSharp
- Serilog

### Platform

- Windows for development
- Ubuntu VM for Linux validation
- Ubuntu on mini PC for final deployment
- Chrome for streaming shortcuts
- MPV for local media playback

## Repository structure

```text
orange-tv/
  launcher/        # Electron + React frontend
  api/             # Local .NET service
  shared/          # Shared types/contracts
  scripts/         # Dev, packaging, and platform scripts
  docs/            # Architecture, setup notes, decisions, diagrams
```

## Product scope

### In scope

- Fullscreen launcher shell
- TV-style navigation
- Streaming shortcut tiles
- Local media browsing and playback
- Watch history and resume points
- Chrome profile persistence
- Ubuntu VM validation path
- Mini-PC bring-up checklist

### Out of scope for the first usable release

- Advanced cloud sync
- Multi-user account system
- Heavy ML-first recommendation engine
- Over-engineered automation before stable launcher flow exists

## Operations and recovery (core platform)

Orange TV is designed to behave like an appliance: if an external app exits/crashes or the shell loses focus, it should reliably return home.

Planned capabilities (tracked in the full plan):

- Watchdog (restart shell/service and restore home)
- Safe mode after repeated failures
- OTA updates with rollback
- Diagnostics export bundle
- Backup/restore (browser profiles, DB, settings, artwork cache)

## Development principles

- Build a fast inner loop on your workstation (Windows or Ubuntu)
- Treat **Ubuntu** as the **runtime reference** for appliance behavior; validate continuously in a VM or on hardware
- Keep hardware-specific work isolated until the device arrives
- Favor stable, explainable behavior over premature complexity
- Use deterministic recommendation logic before ML
- Treat streaming services as shortcut integrations, not the only product value

## Getting started

The product is designed to **ship on Ubuntu** (appliance / mini PC). You can **develop on Windows**, **develop on Ubuntu**, or **validate on an Ubuntu VM** — the same root scripts apply.

| Environment | Doc |
| --- | --- |
| **Ubuntu** (bare metal, VM, or target hardware) | [`docs/local-setup-ubuntu-vm.md`](docs/local-setup-ubuntu-vm.md) — primary runtime guide |
| **Windows** workstation | [`docs/local-setup-windows.md`](docs/local-setup-windows.md) — PowerShell, Chrome paths, Windows-specific notes |

**Sprint validation on Linux:** [`docs/linux-smoke-checklist.md`](docs/linux-smoke-checklist.md) · **Testing matrix (Windows / VM / hardware):** [`docs/testing-matrix-v1.md`](docs/testing-matrix-v1.md)

**Git branches and commits:** see [`CONTRIBUTING.md`](CONTRIBUTING.md).

### Prerequisites

**Core (all platforms):** Node.js LTS, npm, .NET SDK (see `api/*.csproj`), Git.

**Ubuntu:** Install **Chromium** or **Chrome** if you use **`npm run dev`** with **BrowserShell** enabled (auto-opens the launcher). See [`docs/local-setup-ubuntu-vm.md`](docs/local-setup-ubuntu-vm.md).

**Windows:** Chrome may already be present; BrowserShell can use installed Chrome. See [`docs/local-setup-windows.md`](docs/local-setup-windows.md).

**Forward-looking** (streaming / local playback in the plan): MPV, FFprobe — not required for the current scaffold smoke test.

**Optional:** VS Code, SQLite viewer extension, Ubuntu 24.04 VM or device matching the appliance target.

### Local development workflow

1. Run the local .NET service and the **Vite** launcher (**`npm run dev`** at the repo root runs both).
2. Optionally use **`npm run dev:electron`** (with **BrowserShell** disabled if you want only Electron) — see [`docs/local-setup-windows.md`](docs/local-setup-windows.md) or [`docs/local-setup-ubuntu-vm.md`](docs/local-setup-ubuntu-vm.md).
3. **On Windows:** iterate locally; **on Ubuntu:** use the same commands as the target OS.
4. If your main editor is on Windows, still **validate on Ubuntu** regularly (VM or device) using [`docs/linux-smoke-checklist.md`](docs/linux-smoke-checklist.md).

### Suggested commands (from repository root)

```bash
# one-shot install: root deps, launcher deps, dotnet restore
npm run setup

# start Vite (launcher) and API together (API may auto-open Chromium for the launcher URL)
npm run dev

# optional: Vite + Electron — run the API in another terminal (npm run dev:api).
# Set ORANGETV_API__BrowserShell__Enabled=false in .env to avoid a second Chrome window.
npm run dev:electron

# optional: regenerate committed design-system docs (Python + local Cursor skill)
npm run design-system
```

The API listens on **`http://localhost:5144`** and the Vite dev server on **`http://localhost:5173`** (bound to **`127.0.0.1:5173`** in `launcher/vite.config.ts`; **`localhost`** still works in the browser) by default. **Electron**, **BrowserShell**, and **Ubuntu-specific** notes: [`docs/local-setup-windows.md`](docs/local-setup-windows.md), [`docs/local-setup-ubuntu-vm.md`](docs/local-setup-ubuntu-vm.md), and [`docs/electron-shell.md`](docs/electron-shell.md).

> **Note:** Exact scripts may evolve as the monorepo grows; `docs/local-setup-windows.md` stays the concrete Windows reference.

## Environment expectations

Orange TV must support three execution environments:

### Windows

Used for:

- Frontend development
- Backend development
- Seeded launcher data testing
- Basic Chrome and MPV launch flow verification

### Ubuntu VM

Used for:

- Linux path handling validation
- Kiosk/fullscreen flow validation
- Chrome profile persistence testing
- MPV playback validation
- Crash recovery and packaging checks

### Mini PC hardware

Used for:

- HDMI/display behavior
- Controller pairing
- Thermal checks
- Decode/performance validation
- Final appliance readiness

## Roadmap overview

### Sprint 0 — Foundations & Environments

- Repo bootstrap
- Windows-first dev workflow
- Ubuntu VM setup
- Architecture notes and validation checklist

### Sprint 1 — Shell, UI & Navigation

- Electron shell
- Secure preload bridge
- React shell
- Focus grid
- Keyboard and controller navigation

### Sprint 2 — Service, Persistence & Launch Orchestration

- Local .NET service
- SQLite schema and migrations
- Apps/settings/history APIs
- Chrome and MPV launch flow
- Return-to-launcher behavior

### Sprint 3 — Media, History & Recommendation Baseline

- Media scanning
- Metadata extraction
- Thumbnails
- Continue watching
- Rules-based recommendation rows

### Sprint 4 — Ubuntu VM Hardening

- Kiosk validation
- Linux packaging checks
- Crash recovery validation
- Known gaps before hardware

### Sprint 5 — Hardware Bring-up & Release Prep

- Mini-PC deployment
- Decode/performance checks
- Thermals and input-device validation
- Release readiness checklist

## Definition of done

A task is done when:

- Implementation is complete
- The happy path works without silent failures
- Relevant logs/config/docs are updated
- The feature is smoke-tested in the intended environment
- Any follow-up gaps are captured as separate backlog work

## Risks

### Linux-specific behavior drift

Windows development is fast, but Linux validation must happen continuously to prevent late surprises.

### Hardware delay

Core development should never stall waiting for the mini PC.

### Scope creep

The launcher, local service, and playback flow must be stable before expanding into advanced features.

## Near-term backlog focus

- Repo bootstrap
- Ubuntu VM contract environment
- Electron packaging, auto-update, and installer signing (dev shell + `dev:electron` exist today)
- TV-style navigation
- Local API + SQLite
- Chrome/MPV launch orchestration

## Documentation to add next

As the repository evolves, this README should be supported by:

- `docs/architecture.md`
- `docs/launch-flow.md`
- `docs/hardware-bringup-checklist.md`

**Testing matrix v1** is tracked in [`docs/testing-matrix-v1.md`](docs/testing-matrix-v1.md) (revise the version when columns or tiers change).

## Status

Orange TV is currently in the early execution and planning phase.

The immediate focus is building the core launcher and local service on Windows, validating Linux behavior in Ubuntu VM, and preparing for target hardware bring-up once the device arrives.

---

*Orange TV — built for the couch, not the desktop.*
