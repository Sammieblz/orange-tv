---
name: orange-tv-backend-api
description: Build or modify the Orange TV local host service and API. Use this skill when working on the ASP.NET Core backend, Minimal API endpoints, SQLite and EF Core data models, background workers, process launch orchestration for Chrome/MPV/RetroArch, library scanning, watch history, resume points, settings, diagnostics, health snapshots, browser profile persistence, support exports, and appliance recovery behavior.
compatibility: Designed for Cursor Agent Skills. Assumes a Linux appliance product using ASP.NET Core on .NET 10 LTS, SQLite, EF Core, BackgroundService/IHostedService workers, Serilog, TagLibSharp, FFprobe, and local-only process orchestration.
metadata:
  project: Orange TV
  layer: backend-api
  product-surface: local-host-service
  version: "1.0"
---

# Orange TV Backend / API Skill

## Mission
Orange TV's backend is **not** a traditional cloud backend and should not be treated like an MVC website whose primary purpose is serving HTML. It is a **local control plane** for a living-room appliance. It exists to orchestrate playback, manage state, persist history, supervise external processes, expose stable local APIs, and support recovery/diagnostics.

The backend should make the box feel like an appliance:
- resilient,
- predictable,
- restart-safe,
- privacy-preserving,
- and fast enough that the frontend always feels responsive.

## When to use this skill
Use this skill when the task involves any of the following:

- Designing or changing Orange TV API endpoints.
- Converting or maintaining the backend as a local host service.
- Process orchestration for Chrome, MPV, or RetroArch.
- Library scanning for media, music, or games.
- Watch history, resume points, recommendation caching, usage scoring, or session tracking.
- Browser profile persistence, session health hints, or backup/restore metadata.
- EF Core entities, SQLite schema, migrations, and WAL-mode behaviors.
- Background workers for scanning, telemetry, recommendation refreshes, or process monitoring.
- Settings, feature flags, health monitoring, support exports, diagnostics bundles, or crash markers.
- Field-readiness work such as watchdog compatibility, safe mode, rollback support, and operational hardening.

Do **not** use this skill as the primary guide for React composition, GSAP motion, TV focus behavior, or Electron renderer concerns. Use the Orange TV frontend skill for those.

---

# Product and architecture principles

## Appliance-first principle
The backend exists to support a device that boots into a launcher, hides desktop complexity, and always recovers to a usable home state.

## Local-first principle
The highest-quality Orange TV experiences are the ones fully under product control:
- local video,
- local music,
- artwork,
- resume points,
- game launch flows,
- persistent device state.

## Streaming principle
Browser streaming on Linux is a supported convenience layer, not the sole measure of product quality. The backend should optimize for:
- fixed browser profile paths,
- clean launch behavior,
- session persistence,
- return-to-home recovery,
- and supportable diagnostics.

## Privacy principle
Orange TV must never become a credential vault or browser automation product.

### Forbidden privacy violations
- Do not store user passwords.
- Do not read Chrome's encrypted Cookies DB.
- Do not scrape or transmit auth tokens.
- Do not auto-submit login forms on the user's behalf.

The backend can store **state about sessions**, not the secrets themselves.

---

# Preferred architecture

## Recommended platform choices
Prefer these unless the repo clearly differs and the task explicitly requires another approach:

- **Framework**: ASP.NET Core **Minimal API** on **.NET 10 LTS**.
- **Persistence**: SQLite + EF Core.
- **Background execution**: `IHostedService` / `BackgroundService`.
- **Logging**: `Microsoft.Extensions.Logging` with Serilog sinks for rotating local files and support bundles.
- **Serialization**: `System.Text.Json`.
- **Process orchestration**: `System.Diagnostics.Process`.
- **Audio metadata**: TagLibSharp.
- **Video metadata**: FFprobe subprocess calls.
- **File watching**: `FileSystemWatcher` with debouncing.

## Migration guidance from the older plan
If the repository still uses controllers or an MVC framing, the architectural goal remains the same:
- local control plane,
- explicit service boundaries,
- no server-rendered-page mindset.

Controllers are acceptable as a stepping stone, but new work should generally preserve or move toward a clearer local-host-service architecture.

---

# Responsibility model

## Backend/local host service owns
- Launch orchestration.
- Session and process tracking.
- Filesystem scanning.
- Media/game/music metadata ingestion.
- Watch events and resume points.
- Settings and feature flags.
- Health snapshots and crash markers.
- Recommendation computation or caching.
- Support exports.
- Browser profile metadata and backup/restore metadata.

## Electron shell owns
- Fullscreen window lifecycle.
- Preload bridge.
- Navigation guards.
- Restoring window focus when process-state events are received.

## React UI owns
- Rendering and focus UX.
- Presentation state.
- Querying and displaying backend data.

## Hard boundary rules
- The backend is the **launch authority**.
- The frontend should never construct arbitrary local shell commands itself.
- The backend should expose a stable typed API rather than leaking implementation details.
- Keep the backend local-first and cloud-optional; do not assume external infrastructure.

---

# Preferred project structure

When adding or reorganizing backend code, favor a structure like this:

```text
api/
  Endpoints/                 # or Controllers/ while migrating
    AppsEndpoints.cs
    MediaEndpoints.cs
    MusicEndpoints.cs
    GamesEndpoints.cs
    HistoryEndpoints.cs
    SettingsEndpoints.cs
    SystemEndpoints.cs
    SupportEndpoints.cs
  Models/
    App.cs
    MediaItem.cs
    MusicTrack.cs
    Game.cs
    WatchEvent.cs
    UserBehavior.cs
    Recommendation.cs
    LaunchSession.cs
    ResumePoint.cs
    DeviceHealthSnapshot.cs
    CrashEvent.cs
    ServiceProfile.cs
  Services/
    LaunchService.cs
    LibraryService.cs
    HistoryService.cs
    SettingsService.cs
    HealthService.cs
    SupportService.cs
    RecommendationService.cs
  Workers/
    LibraryScannerWorker.cs
    BehaviorTrackerWorker.cs
    HealthWorker.cs
    ProcessWatcherWorker.cs
    RecommendationRefreshWorker.cs
  Data/
    OrangeTvDbContext.cs
    Config/
    Migrations/
    Seed/
  Contracts/
    Requests/
    Responses/
  Program.cs
  appsettings.json
```

Organize by responsibility. Avoid placing process logic in endpoint classes or using the DbContext as the de facto business layer.

---

# Core service modules

## LaunchService
Responsible for:
- building commands for Chrome, MPV, and RetroArch,
- validating launch intent,
- choosing the correct profile/path/core/options,
- spawning child processes,
- recording launch session rows,
- tracking process metadata,
- publishing process completion state.

### Rules
- Launch commands should be deterministic and derived from validated input.
- Do not allow arbitrary command injection.
- Centralize all command construction here.
- Record a session row before or immediately as part of launch orchestration.

## LibraryService
Responsible for:
- scanning media/music/game roots,
- extracting metadata,
- maintaining artwork cache references,
- debouncing filesystem change bursts,
- upserting catalog entries safely.

## HistoryService
Responsible for:
- storing watch events,
- deriving resume points,
- exposing recent sessions,
- computing or helping compute continue-watching rows.

## SettingsService
Responsible for:
- profile paths,
- library roots,
- display preferences,
- feature flags,
- parental settings,
- appliance-level toggles.

## HealthService
Responsible for:
- collecting health snapshots,
- crash markers,
- selected renderer/service health markers,
- operational telemetry useful for diagnostics.

## SupportService
Responsible for:
- packaging logs,
- settings snapshots,
- database metadata,
- recent crash markers,
- environment details,
- and diagnostics into a support export bundle.

## RecommendationService
Preferred production strategy:
- rules-first,
- heuristics second,
- optional on-device ML later only when the local data quality justifies it.

Do not make ML a prerequisite for the product feeling intelligent.

---

# API design guidelines

The API is local-only and should be optimized for clarity and reliability.

## Endpoint categories
Provide or preserve endpoints for at least these domains:
- `/api/apps`
- `/api/media`
- `/api/music`
- `/api/games`
- `/api/history`
- `/api/recommendations`
- `/api/settings`
- `/api/system`
- `/api/support`
- `/api/launch` or a launch-specific action surface

## Endpoint style
Prefer:
- typed request/response DTOs,
- explicit result contracts,
- validation before side effects,
- concise and stable JSON shapes,
- clear status codes.

## Response philosophy
Return information the UI can use directly, such as:
- app/session hints,
- launch/session state,
- continue-watching row items,
- settings snapshots,
- system health summaries,
- support export status.

Avoid exposing implementation internals the UI does not need.

## Example launch contract
```json
{
  "type": "streaming",
  "appId": "netflix",
  "url": "https://netflix.com"
}
```

A successful response should ideally include enough information for UI state and diagnostics, for example:

```json
{
  "launchSessionId": "01JSTREAMABC123",
  "accepted": true,
  "adapter": "chrome",
  "state": "launching"
}
```

---

# Process launch orchestration

This is one of the most important backend responsibilities.

## Launch pipeline
1. Receive a typed launch request.
2. Validate type, identifiers, and required paths/URLs.
3. Resolve settings and profile paths.
4. Build the final command.
5. Record a `launch_sessions` row.
6. Spawn the child process.
7. Monitor the process.
8. Record exit status, duration, recovery state, and timestamps.
9. Notify Electron that the launcher should be restored.
10. Make the latest state available to frontend queries.

## Chrome launches
Chrome should be launched with a fixed `--user-data-dir` so sessions persist. Support:
- shared profile mode,
- optional per-service profile mode.

### Example command shape
```csharp
private string BuildChromeCommand(string url, string profilePath)
{
    return $"google-chrome " +
           $"--kiosk " +
           $"--app={url} " +
           $"--user-data-dir={profilePath} " +
           $"--no-first-run " +
           $"--disable-translate " +
           $"--autoplay-policy=no-user-gesture-required";
}
```

### Rules for Chrome session persistence
- The profile path must be stable and durable.
- Deleting or changing the profile path logs the user out of services.
- The backend can track `is_authenticated`, `session_stale`, and `last_launched_at` as hints.
- The backend must not inspect credential stores.

## MPV launches
- Use MPV as the preferred local media adapter.
- Preserve resume point awareness where applicable.
- Favor VA-API hardware decode.
- Refresh continue-watching/recent rows after playback exit.

## RetroArch launches
- Treat RetroArch as the console-style game launch adapter.
- Normalize core selection and controller expectations.
- Track last-played and save-state related metadata when available.

## Security rule
The backend should never execute arbitrary shell fragments supplied by the client. All launch requests must map to validated command builders.

---

# Data model guidance

## Core tables
The backend should preserve or evolve around these core tables:
- `apps`
- `media_items`
- `music_tracks`
- `games`
- `watch_events`
- `user_behaviors`
- `recommendations`
- `settings`
- `artwork_cache` or `thumbnails`

## Operational tables
These should exist or be added in the revised design:
- `launch_sessions`
- `resume_points`
- `device_health_snapshots`
- `crash_events`
- `service_profiles`

## Schema intent by table
### `apps`
Should support:
- launch metadata,
- sort order,
- usage scoring,
- session hinting,
- profile mapping,
- last-launched timestamps.

Prefer fields such as:
- `id`
- `label`
- `type`
- `launch_url`
- `chrome_profile`
- `sort_order`
- `usage_score`
- `is_authenticated`
- `session_stale`
- `last_launched_at`

### `media_items`
Should support flexible metadata via `metadata_json` because local libraries vary.

### `watch_events`
Should capture:
- source type,
- source id,
- started at,
- ended at,
- progress seconds,
- completion state.

This event stream is the durable truth from which resume points and behavior scoring can be derived.

### `launch_sessions`
One row per external process launch.
Useful for:
- troubleshooting,
- recent session views,
- recovery state,
- exit reason,
- timing analysis.

### `resume_points`
Store last-known playback offsets or re-entry data.

### `device_health_snapshots`
Store CPU, RAM, storage, temperature, and selected process or renderer health markers.

### `crash_events`
Store crash signatures, restart markers, recent action context, and safe-mode triggers.

### `service_profiles`
Map apps to browser profiles and store profile backup/session-health metadata.

---

# SQLite and persistence guidance

## Storage philosophy
Orange TV uses embedded storage because it is a single-box appliance. Prefer zero-external-dependency persistence and predictable local recovery.

## SQLite rules
- Use WAL mode.
- Keep migrations explicit and source-controlled.
- Design for concurrent read-heavy UI access with background writes.
- Avoid long transactions in worker loops.
- Use indexes for common row materialization queries.

## EF Core rules
- Keep entities clean and purpose-driven.
- Use DTOs for API shapes.
- Avoid overloading EF entities with UI-only concerns.
- Avoid N+1 query patterns in row-building endpoints.
- Consider compiled queries or projection when read paths become hot.

---

# Background workers

Workers are a core part of the appliance behavior.

## LibraryScannerWorker
Recommended behavior:
- run on startup,
- run on debounced filesystem changes,
- optionally periodic sweep for drift correction.

Responsibilities:
- scan media/music/game directories,
- extract metadata,
- update the SQLite catalog,
- refresh artwork metadata,
- avoid duplicate ingestion work.

## BehaviorTrackerWorker
Recommended cadence: around every 10 minutes.

Responsibilities:
- convert raw watch events into aggregated signals,
- compute preferred genres,
- usage scores,
- active hours,
- row ranking hints,
- abandonment/completion signals.

## HealthWorker
Recommended cadence: every few seconds.

Responsibilities:
- temperature,
- memory,
- disk,
- process health,
- optional diagnostics overlay data,
- support export inputs.

## ProcessWatcherWorker
Continuous loop.

Responsibilities:
- monitor Chrome/MPV/RetroArch child processes,
- update launch session state,
- record end times,
- signal Electron to restore the launcher.

## RecommendationRefreshWorker
Periodic rebuild of deterministic recommendation cache.
ML training should be feature-flagged and optional.

## Worker implementation rules
- Honor cancellation tokens.
- Back off under load.
- Prefer idempotent scans and updates.
- Do not block UI-critical API responsiveness.
- Isolate worker failures so one bad scan does not destabilize the appliance.

---

# Personalization ladder

## Production-first strategy
Start with explainable ranking logic:
- recent use,
- frequency,
- resume state,
- genre proximity,
- time-of-day hints.

## Optional future strategy
Layer on on-device ML only after local datasets are rich enough.

## Agent guidance
If a task proposes jumping directly to a complex ML solution, prefer a deterministic rules-first implementation unless the request explicitly demands ML work and sufficient supporting data exists.

---

# Session persistence and browser profiles

## Core idea
Session persistence comes from Chrome profile directories on disk.

The backend should treat this as a first-class product feature because it preserves sign-in convenience after restarts or reinstalls.

## Required behaviors
- Use a fixed `--user-data-dir`.
- Support shared or per-service profile mapping.
- Store profile path configuration in settings.
- Track profile existence and session-health hints.
- Support backup/restore workflows for profile folders.

## Safe hinting model
The backend may expose:
- `is_authenticated`
- `session_stale`
- `last_launched_at`
- missing-profile reset conditions

The backend must **not** expose secrets or raw token material.

## Missing-profile behavior
If the profile directory is missing or cleared:
- reset session hint state,
- mark affected apps as unknown / not authenticated,
- surface a recoverable notification path to the UI.

---

# Reliability, recovery, and operations

This is not optional platform polish. It is central to the product.

## Reliability capabilities to support
- Watchdog-friendly process behavior.
- Safe mode compatibility after repeated failures.
- OTA update readiness and rollback metadata.
- Diagnostics export.
- Backup/restore.
- Fast restart to home state.

## Backend responsibilities in support of operations
- Persist crash markers.
- Keep logs structured and rotated.
- Store enough state for support exports.
- Avoid brittle startup assumptions.
- Fail gracefully when configuration is missing.
- Support field debugging without cloud dependencies.

## Operational requirement
If the launcher or service fails, recovery should happen in seconds, not by dropping the user into desktop confusion.

---

# Logging and diagnostics

## Logging goals
Logs should help reconstruct:
- launches,
- worker activity,
- config load,
- profile resolution,
- scan results,
- crash recovery,
- update/backup/restore flows.

## Logging rules
- Use structured logs.
- Log identifiers for sessions, apps, and workers.
- Avoid logging secrets or personal credentials.
- Keep messages support-friendly.
- Use rotating files suitable for export bundles.

## Support export contents
A good support export may include:
- recent logs,
- settings snapshot,
- health snapshots,
- crash events,
- launch session summaries,
- environment/version information,
- backup metadata,
- selected database summaries.

---

# Validation and failure handling

## Validate before side effects
Before launching or writing:
- verify app/media/game identifiers,
- verify file paths or profile roots if required,
- verify settings availability,
- verify adapter compatibility.

## Failure handling rules
- Return clear errors.
- Prefer recoverable errors over generic 500s.
- Record operationally relevant failures.
- Keep the service usable even when one subsystem is degraded.
- Avoid startup crashes when a library path is missing; degrade and report instead.

---

# Recommended implementation workflow for agent tasks

When using this skill, follow this order unless the task clearly requires a different sequence:

1. **Identify the backend surface**: endpoint, service, worker, entity, or operations layer.
2. **Preserve the local-host-service role**: avoid slipping into MVC page mentality.
3. **Check whether the task touches launch authority, persistence, or workers**.
4. **Map data flow**: request -> validation -> service -> persistence -> event/response.
5. **Guard privacy and command safety**.
6. **Handle recovery and diagnostics implications**.
7. **Keep contracts stable for Electron/React consumers**.
8. **Prefer deterministic, supportable solutions over clever but fragile ones**.

---

# Definition of done for backend changes

A backend task is not done until most of the following are true:

- The backend remains the launch authority.
- Endpoints are typed, validated, and stable.
- No arbitrary command execution is possible from client input.
- Persistence changes have migrations or a clear schema path.
- Worker behavior honors cancellation and does not harm responsiveness.
- Logs and diagnostics remain useful.
- Session persistence respects privacy boundaries.
- Recovery or crash implications were considered.
- The change fits the local control-plane architecture.
- The frontend contract impact is explicit.

---

# Common anti-patterns to reject

Reject or refactor approaches that do any of the following:

- Treat the backend like a server-rendered website.
- Put process orchestration directly inside endpoint handlers.
- Let client input determine raw shell commands.
- Store passwords, tokens, or scraped browser secrets.
- Depend on cloud services for core appliance behavior.
- Make ML mandatory for baseline recommendations.
- Run heavy worker logic on request threads.
- Store every metadata field as rigid columns when flexible JSON is more realistic for v1.
- Ignore supportability, logging, or crash-state persistence.
- Collapse settings, launch state, and operational state into an unstructured blob.

---

# Output style for the agent

When carrying out a task with this skill, the agent should:

- Preserve the local-host-service architecture.
- Make small, verifiable changes unless the task clearly requires a larger refactor.
- Explain endpoint, schema, worker, and launch-flow implications.
- Call out privacy, reliability, or field-support tradeoffs.
- Prefer deterministic and explainable behavior over speculative complexity.

---

# Quick reference checklist

## If the task is an endpoint change
- Is the contract typed and stable?
- Is validation explicit?
- Does the service layer own the logic?
- Are errors clear and recoverable?

## If the task touches launches
- Is the backend still the only launch authority?
- Are commands built from validated inputs?
- Is the session recorded?
- Is Electron notified on exit?

## If the task touches data
- Does the schema reflect durable truth vs cached materialization?
- Are migrations clear?
- Does WAL/concurrency behavior remain healthy?
- Is JSON flexibility used where appropriate?

## If the task touches workers
- Is cadence reasonable?
- Are cancellation tokens honored?
- Is work idempotent or safely repeatable?
- Can failures degrade gracefully?

## If the task touches session persistence
- Are profile paths durable?
- Are only hints, not secrets, stored?
- Is missing-profile recovery handled?
- Is backup/restore considered?

This skill should make the agent behave like a disciplined Orange TV appliance backend engineer, not a generic CRUD API coder.
