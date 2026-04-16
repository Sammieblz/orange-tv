# ORANGE TV | Revised Full-Scope Project Plan

**Appliance Platform • UX Shell • Local Media • Streaming Sessions • Games • Operations**  
**Version 1.2 — March 2026**  
**Revision focus:** product positioning, architecture cleanup, platform hardening, delivery sequencing, and restored implementation detail

> **Confidential — Orange TV Project**

## Product statement

Orange TV is a Linux-based living-room appliance that unifies local media, browser-based streaming shortcuts with persistent sessions, and retro gaming inside a fast TV-first launcher backed by a local service for playback orchestration, personalization, diagnostics, and recovery.

## Revision summary

This revision keeps the strongest elements from the original plan (TV-first interface, dedicated appliance hardware, local media support, persistent browser sessions, and game-launch workflow) while tightening the architecture and clarifying the product promise.

This update reincorporates implementation-level detail for the frontend, local host service, background workers, launch pipeline, and SQLite schema so the document works as both an architecture brief and a build-facing development plan.

### Summary of changes

| Area | Original plan | Revised recommendation |
| --- | --- | --- |
| Product promise | 4K HDR streaming box, local media, recommendations, games | Unified home-entertainment appliance; local media + launcher quality are premium pillars, Linux streaming is best-effort convenience |
| Window/session strategy | Openbox first, possible later move to Sway | Single shipping baseline: Wayland session with **labwc** for appliance behavior and simpler fullscreen window management |
| Backend model | ASP.NET Core MVC on .NET 9 | ASP.NET Core **Minimal API** on **.NET 10 LTS** with clear responsibility boundaries |
| Personalization | ML-first recommendation framing | Rules-first ranking, heuristics second, optional on-device ML only after data quality justifies it |
| Roadmap | Feature phases skewed toward breadth | Operationally sequenced releases prioritizing platform stability, recovery, and shippable slices |

### Strategic note

Orange TV should be marketed as a premium launcher and local-first media appliance with strong session persistence and polished TV ergonomics — not as a guaranteed high-fidelity Linux replacement for dedicated commercial streaming boxes.

## MVP baseline (shipped in repo)

The following capabilities are implemented in the current codebase and form the **MVP baseline** for further appliance work. Detailed behavior and HTTP contracts: [`docs/launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md), [`docs/electron-shell.md`](electron-shell.md), [`docs/environment.md`](environment.md).

- **Electron shell lock:** Appliance / `ORANGETV_ELECTRON__KIOSK` kiosk-locked fullscreen (`setFullScreenable(false)`), renderer cannot leave fullscreen via IPC when locked, dev **F11** disabled when kiosk-locked; **`orange-tv:shell-focus`** to focus the shell after minimizing external apps.
- **Launch sessions:** SQLite `launch_sessions` rows per spawn; **`GET /api/v1/launch/sessions/active`** lists active sessions with app labels.
- **OS window control:** **`POST .../minimize`** and **`POST .../foreground`** — **Win32** implementation on Windows; **501** on Linux/macOS until a non-Windows orchestrator exists.
- **Launcher:** **Running apps** dock (minimize/switch + operator notes), TanStack Query polling / invalidation on launch success.

Validation: [`docs/linux-smoke-checklist.md`](linux-smoke-checklist.md), [`docs/testing-matrix-v1.md`](testing-matrix-v1.md).

## Section 1 — Product definition and planning principles

The project centers on one clean end-state: an appliance that feels fast, intentional, and resilient from the moment the TV turns on. Every architecture choice should support appliance behavior first and feature breadth second.

### Planning principles

- Appliance first: boot directly into the Orange TV shell, hide the desktop, and always provide a predictable route back home.
- Local-first premium experience: local video, music, artwork, resume points, and game launching should feel best-in-class.
- Best-effort browser streaming: persistent sign-in sessions and clean launch behavior matter more than perfect Linux streaming parity.
- Fast path home: external app exit, crash, or focus loss must restore the launcher quickly and safely.
- Reliability before novelty: watchdogs, logs, diagnostics, update rollback, and safe mode are core platform features.
- Privacy by design: never store account passwords or read browser cookie databases directly.

### Product boundary

Orange TV is not a cloud media service, credential vault, or web automation tool. It is a local control plane and shell that orchestrates trusted desktop software already running on the box.

## Section 2 — Hardware, peripherals, and installation target

The platform stays within a practical small-form-factor budget while preserving headroom for local playback and mid-tier emulation.

### Recommended appliance tiers

| Component | Recommended baseline | Why it stays in scope |
| --- | --- | --- |
| Primary mini PC | Beelink EQ12 Pro class device with Intel N100 / 16 GB RAM / 500 GB NVMe | Low power draw, quiet thermals, strong Linux hardware decode support |
| Upgrade tier | Ryzen 9 6900HX class mini PC | For heavier emulation or if gaming becomes more prominent |
| Primary input | Wireless keyboard + touchpad plus controller support | Best for dev usability + couch navigation |
| Network | Gigabit Ethernet preferred; solid 5 GHz Wi‑Fi minimum | Improves stability for updates, metadata fetches, and streaming |

### Installation assumptions

- Single-user appliance image installed on a dedicated mini PC connected to one television.
- Device auto-signs-in to a dedicated local account and launches Orange TV immediately after boot.
- Media libraries live on internal NVMe or attached USB SSD.
- The product tolerates being unplugged or hard-powered-down more often than a normal desktop.

## Section 3 — Appliance OS and session strategy

Ubuntu 24.04 LTS remains the recommended base OS. The platform standardizes on a single shipping session strategy.

### Chosen session baseline

Use a **Wayland session with labwc** as the default appliance compositor.

### OS configuration goals

1. Auto-login to a dedicated local appliance account.
2. Start the labwc session without exposing a desktop workflow.
3. Launch the Orange TV shell automatically and restart it if it exits unexpectedly.
4. Install required drivers, browser, playback adapters, and local host service as system packages/services.
5. Disable blanking, sleep, and consumer-desktop interruptions (first-run dialogs, update prompts).
6. Persist settings, browser profiles, logs, caches, and database in a documented application directory with a backup story.

### Platform note on streaming

Browser streaming is a supported convenience integration. Optimize for clean launch, persistent sign-in, and graceful recovery even when service-specific Linux browser capabilities are limited.

## Section 4 — UX design system and TV interaction model

Orange TV remains dark, content-forward, and fast-feeling; orange is used sparingly for focus/selection/brand.

| Area | Keep | Refinement |
| --- | --- | --- |
| Navigation | Left rail, hero, content rows | Keep shell consistent so movement is predictable from ten feet away |
| Focus model | Scale, glow ring, brightness shift | Focus states only; avoid hover metaphors; transitions under ~150 ms |
| Content tiles | Square tiles for services; wide cards for media/games | Show progress/save-state/signed-in indicators only when decision-relevant |
| Typography | Large headings + compact metadata | Prioritize distance legibility over density |

### Interaction rule

Every action has an obvious opposite action: if a user can launch Chrome/MPV/RetroArch, Orange TV must reliably detect exit, restore focus, and repaint state on return.

## Section 5 — Full-scope architecture

The architecture is simplified into durable layers with explicit responsibilities:

- Electron shell: windowing, preload bridge, trusted IPC surface, return-to-home behavior.
- React UI: TV interface, focus grid, screens/overlays, presentation state.
- Local host service: launch orchestration, scanning, settings, history, diagnostics, device state.
- Playback adapters: Chrome, MPV, RetroArch remain external tools under managed launch control.
- Operations plane: watchdogs, updates, backup, recovery, support exports.

## Section 6 — Shell and frontend responsibilities

Electron is a secure shell; React is the product UI. Launching local processes is not a renderer concern.

### Electron shell responsibilities

- Fullscreen window + lifecycle management.
- Minimal preload API.
- Navigation guards to prevent becoming a general-purpose browser.
- Restore launcher after external app exit.
- Crash screen + safe return to recoverable home.

### React UI responsibilities

- Render home, services, media, settings, overlays, search.
- Maintain D-pad/controller navigation model as first-class UX.
- Cache/refresh rows (Continue Watching, Recently Played, Top Apps) after returning from external processes.
- Never launch arbitrary processes directly; all launches route through shell + local host service.

### Security defaults

- Context isolation enabled.
- Node integration disabled in renderer.
- Sandboxed renderers and narrow preload bridge.
- IPC allowlist + payload validation.
- Treat remote web content as untrusted; do not expose Electron internals to it.

### Concrete frontend stack (retained detail)

- Shell: Electron 31+ fullscreen kiosk mode + narrow preload bridge
- Build: Vite 5
- UI: React 18
- Styling: CSS variables + CSS Modules
- Animation: GSAP 3
- Client state: Zustand
- Server state: TanStack Query
- Icons/fonts: Iconoir SVG + bundled local fonts (e.g., Plus Jakarta Sans, Inter)

### Suggested frontend workspace structure

```text
launcher/
  electron/
    main.js
    preload.js
  src/
    components/
    hooks/
    store/
    api/
    styles/
    App.jsx
```

### Navigation and input model (illustrative)

```js
export function useNavigation(layout) {
  const [pos, setPos] = useState({ row: 0, col: 0 });
  useEffect(() => {
    const onKey = (e) => {
      switch (e.key) {
        case "ArrowUp":    moveFocus(-1, 0); break;
        case "ArrowDown":  moveFocus(+1, 0); break;
        case "ArrowLeft":  moveFocus(0, -1); break;
        case "ArrowRight": moveFocus(0, +1); break;
        case "Enter":      launchFocused();  break;
        case "Escape":     goBack();         break;
      }
    };
  }, [layout]);
}
```

### Launch-path integration (high-level)

- React raises typed launch requests (e.g., `window.electronAPI.launchApp(payload)`).
- Preload validates and forwards allowlisted launch actions.
- Electron main forwards request to local host service (does not spawn arbitrary commands from renderer).
- Local host service builds Chrome/MPV/RetroArch command, records launch session, spawns process.
- On exit, service emits completion, Electron restores launcher, UI refreshes key rows.

## Section 7 — Local host service (.NET 10 LTS)

The backend is a local host service (control plane), not a server-rendered MVC app.

### Recommended stack

| Concern | Recommendation | Reason |
| --- | --- | --- |
| Framework | ASP.NET Core Minimal API on .NET 10 LTS | Smaller surface area, easier hosting, long support runway |
| Persistence | SQLite + EF Core | Strong fit for single-device local model |
| Background work | Hosted services with explicit scheduling | Clear place for scanners, polling, refreshes, supervision |
| Logging | Structured local logs + support export packaging | Faster debugging without cloud dependency |

### Core service modules

- LaunchService
- LibraryService
- HistoryService
- SettingsService
- HealthService
- SupportService

### Personalization ladder

Rules-first ranking (recent use, frequency, resume state, genre proximity) → heuristics (time-of-day) → optional on-device ML later (feature-flagged).

### Implementation detail (retained)

- Process management: `System.Diagnostics.Process` for Chrome/MPV/RetroArch
- Metadata: TagLibSharp + FFprobe subprocess calls
- File watching: `FileSystemWatcher` with debouncing
- Logs: Microsoft logging + Serilog rotating files and support bundles
- JSON: `System.Text.Json`

### Suggested local host service structure

```text
api/
  Endpoints/ or Controllers/
  Models/
  Services/
  Workers/
  Data/
  Program.cs
  appsettings.json
```

### Background workers and schedules

- LibraryScannerWorker: startup + debounced FS changes
- BehaviorTrackerWorker: every 10 minutes
- HealthWorker: every few seconds
- ProcessWatcherWorker: continuous async loop
- Recommendation refresh worker: periodic cache rebuild; ML only when feature-flagged + data-rich

### Performance strategy

- MPV + VA-API for decode
- Streaming attempts hardware accel but tolerates limitations
- SQLite WAL mode
- Workers back off under load; UI responsiveness wins
- Strict renderer isolation + narrow IPC

## Section 8 — Data model and persistence

The DB expands so operations/supportability/session integrity are first-class.

### Core tables

- apps
- media_items
- music_tracks
- games
- watch_events
- user_behaviors
- recommendations
- settings
- artwork_cache

### Operational extensions

- launch_sessions
- resume_points
- device_health_snapshots
- crash_events
- service_profiles

### Schema notes

- `apps` includes `launch_url`, `chrome_profile`, `usage_score`, `is_authenticated`, `session_stale`, `last_launched_at` so the UI can show session hints without touching credentials.
- `media_items` uses flexible `metadata_json`.
- `watch_events` captures timing + progress to derive resume + behavior scoring.
- `user_behaviors` stores aggregates (not recomputed per request).
- recommendations are cacheable/disposable; underlying events remain truth.

### Illustrative schema fragments

```sql
CREATE TABLE apps (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT,
  launch_url TEXT,
  chrome_profile TEXT,
  sort_order INTEGER,
  usage_score REAL DEFAULT 0,
  is_authenticated INTEGER DEFAULT 0,
  session_stale INTEGER DEFAULT 0,
  last_launched_at DATETIME
);

CREATE TABLE watch_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT,
  source_id TEXT,
  started_at DATETIME,
  ended_at DATETIME,
  progress_seconds INTEGER,
  completed INTEGER
);
```

## Section 9 — Playback, streaming sessions, and games

### Browser-based streaming

- Chrome launches with fixed `user-data-dir` to persist sessions.
- Shared profile mode + optional per-service profiles.
- UI shows soft hints (Signed In, Last Used, May Need Sign-In) without inspecting credential stores.
- Backup/restore browser profiles is a real user feature.

### Local media via MPV

- MPV is the primary adapter for video + music.
- Resume points, progress, subtitles, artwork are part of product experience.
- Refresh Continue Watching / recently played on return to launcher.

### Games via RetroArch

- RetroArch as umbrella adapter.
- Show platform, artwork, last-played, save-state awareness where available.
- Normalize controller mappings at platform layer.

## Section 10 — Reliability, recovery, and operations

Appliance trust comes from predictable recovery behavior, not only features.

| Capability | What it does | Why it matters |
| --- | --- | --- |
| Watchdog | Restarts shell/service after failure; returns to usable home | Prevents “fragile desktop” feel |
| Safe mode | Boots with nonessential features disabled after repeated failures | Recovery path when builds/configs break |
| OTA updater | Download/validate/apply/rollback updates | Realistic field maintenance |
| Diagnostics export | Bundle logs, settings, crash markers, env details | Reduces time-to-debug |
| Backup/restore | Backup browser profiles, settings, DB, artwork caches | Preserves setup effort + session state |

### Operational requirement

If the launcher crashes, recovery should happen in seconds. Appliance behavior must beat developer convenience.

## Section 11 — Delivery roadmap

Sequenced by operational value; each release stands on its own.

| Release | Primary objective | Exit criteria |
| --- | --- | --- |
| 0 | Platform base | Boots into Orange TV, watchdog works, logs persist, settings bootstrap stable |
| 1 | Launcher core | Home screen, D-pad navigation, Chrome launch, return-to-home reliable |
| 2 | Local media | Scanning, artwork, MPV launch, resume points, Continue Watching end-to-end |
| 3 | Games | RetroArch launch, ROM indexing, controller support, last-played metadata |
| 4 | Personalization | Top Apps, recent rows, heuristic recommendations, search; explainable |
| 5 | Operations | OTA rollback, diagnostics export, backup/restore, safe mode field-ready |

## Section 12 — Key risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Linux browser streaming variance | Some services may have lower resolution/compatibility | Position as best-effort convenience; validate per service; make local media a core differentiator |
| Focus restoration after external apps | Users can get stranded outside shell | Centralize session tracking; bake return-to-home recovery into exit criteria |
| Metadata quality drift | Poor scans/art gaps reduce polish | Cache normalized metadata; allow manual corrections later; use clean placeholders |
| Update regressions | A bad release can “brick” appliance | Signed packages, staged rollouts where applicable, rollback-safe design |
| Controller inconsistency | Different devices behave differently | Platform mapping layer + small certified controller matrix |

## Final recommendation summary

Proceed as a local-first entertainment appliance with a polished shell, dependable session persistence, and strong media/game orchestration. Keep mini-PC approach, preserve design system, and harden around recovery/operations with clear responsibility boundaries.

| Decision | Recommendation |
| --- | --- |
| OS baseline | Ubuntu 24.04 LTS appliance image with a Wayland labwc session |
| Shell | Electron as secure kiosk shell; React for TV UI |
| Backend | ASP.NET Core Minimal API on .NET 10 LTS |
| Data | SQLite + structured caches + support artifacts |
| Streaming approach | Persistent Chrome profiles with best-effort Linux service support |
| Differentiator | Local media quality, fast return-home behavior, polished TV ergonomics |

**Orange TV — built to boot clean, launch fast, recover safely, and feel at home on a television.**
