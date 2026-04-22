---
name: orange-tv-design-system
description: >-
  Applies Orange TV monorepo standards for TV-first UI, Electron shell security, ASP.NET Core API
  patterns, testing, and docs. Use when implementing or reviewing launcher (React/Vite/Electron),
  api/ (Minimal API, EF Core), IPC, styling, accessibility, or when the user mentions design
  system, 10-foot UI, orange accent, focus model, or repo conventions.
---

# Orange TV — design system and engineering standards

This skill binds **visual design** (living-room / 10-foot UI) to **how we write code** in this repository. Prefer **existing patterns** over new abstractions unless a doc or issue says otherwise.

## Sources of truth (read before large changes)

| Area | Location |
| --- | --- |
| **Product / roadmap** | [`docs/project-plan.md`](../../../docs/project-plan.md), [`docs/player-and-streaming-strategy.md`](../../../docs/player-and-streaming-strategy.md) |
| **Generated design tokens (ui-ux-pro-max)** | [`docs/design-system/MASTER.md`](../../../docs/design-system/MASTER.md), [`docs/design-system/README.md`](../../../docs/design-system/README.md) — regenerate with `npm run design-system` from repo root |
| **CSS variables (launcher)** | [`launcher/src/styles/variables.css`](../../../launcher/src/styles/variables.css) — orange accent, surfaces, focus ring, radii, transitions |
| **Env & API surface** | [`docs/environment.md`](../../../docs/environment.md), [`.env.example`](../../../.env.example) |
| **Electron IPC** | [`docs/electron-shell.md`](../../../docs/electron-shell.md), [`launcher/electron/ipc-contract.cjs`](../../../launcher/electron/ipc-contract.cjs) |
| **Contributing & tests** | [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) |

Optional: the **ui-ux-pro-max** skill (`.cursor/skills/ui-ux-pro-max/`) for discovery-style searches; Orange TV still obeys **variables.css** + **MASTER.md** for shipped look.

---

## Visual and interaction design (launcher)

- **Context:** TV distance, D-pad / gamepad / keyboard; **no** tiny click targets; clear **focus** state everywhere.
- **Palette & type:** Use **CSS variables** from `variables.css` (`--color-orange`, `--color-bg`, `--font-display`, `--focus-ring`, etc.). Do not introduce ad-hoc hex colors for core chrome without updating variables and/or `docs/design-system/MASTER.md`.
- **Motion:** Prefer `--transition-fast` / `--transition-medium` and existing patterns; avoid gratuitous animation on the critical path to **home**.
- **Layout:** Follow established shell layout (sidebar, row grids, hero). New surfaces should reuse **Card** / row / tile patterns already in the launcher.
- **Iconography:** Prefer **Iconoir** (or existing project icon set) for consistency.
- **Accessibility:** Focus order must be logical for remote navigation; see [`docs/focus-navigation.md`](../../../docs/focus-navigation.md) and [`docs/gamepad-focus-recovery.md`](../../../docs/gamepad-focus-recovery.md).

When regenerating the persisted design system, keep **`MASTER.md`** aligned with `variables.css` (or document intentional deltas in the design doc).

---

## Frontend (`launcher/`) — code standards

- **Stack:** Vite, React 18, TypeScript (strict as configured), **CSS Modules** (and global `variables.css`), Zustand, TanStack Query, GSAP where already used.
- **Imports:** Vite alias `@/` → `launcher/src/`. Match existing style (this repo often uses explicit `.ts` / `.tsx` suffixes in imports — stay consistent with neighboring files).
- **Components:** Functional components; colocate tests as `*.test.ts` / `*.test.tsx` next to code when adding behavior.
- **State:** Prefer existing stores and query hooks; avoid global singletons that bypass the React tree without a reason documented in code or docs.
- **API calls:** Use shared client / hooks under `launcher/src/api/`; respect `VITE_ORANGETV_API_BASE_URL` and CORS assumptions from [`docs/environment.md`](../../../docs/environment.md).

### Electron (non-negotiables)

- **Renderer:** No direct `require`, `process`, or `ipcRenderer` — only **`window.orangeTv`** from [`launcher/electron/preload.cjs`](../../../launcher/electron/preload.cjs) via `contextBridge`.
- **Privileged work** (launch HTTP, window chrome) lives in **main** with **`ipcMain.handle`**; never from React.
- **Window lifecycle, kiosk, F11:** [`docs/electron-window-lifecycle.md`](../../../docs/electron-window-lifecycle.md), [`docs/electron-shell.md`](../../../docs/electron-shell.md).

---

## Backend (`api/`) — code standards

- **Stack:** ASP.NET Core **Minimal API** (see [`api/Program.cs`](../../../api/Program.cs)), **.NET 9** TFM in [`api/OrangeTv.Api.csproj`](../../../api/OrangeTv.Api.csproj), EF Core + SQLite, Serilog.
- **Structure:** Endpoints in `api/Endpoints/` (or grouped by feature), services in `api/Services/`, platform abstractions in `api/Platform/`, configuration via `OrangetvApiOptions` and `appsettings` + env vars with **`ORANGETV_API__...`** (see `docs/environment.md`).
- **Style:** C# with **4-space** indent per [`.editorconfig`](../../../.editorconfig); `Nullable` enable; `ImplicitUsings` on the project; prefer clear names over abbreviations; async with `ConfigureAwait` where the codebase already does for DB paths.
- **Migrations:** After model changes, add EF migrations and ensure startup applies them per [`CONTRIBUTING.md`](../../../CONTRIBUTING.md).
- **Tests:** xUnit in `OrangeTv.Api.Tests`; integration style for API endpoints; keep **404/501** behavior explicit where platform work is Windows-only (see `CONTRIBUTING`).

---

## System architecture (mental model)

1. **Electron shell** — Owns the TV window, preload, lifecycle, return-from-external-app flows.
2. **React** — 10-foot UI, focus, home rows, **Running apps** dock, TanStack Query to local API.
3. **.NET API** — Persistence, settings, media, `launch_sessions`, `POST /api/v1/launch`, health, recommendations.

**Child processes (Chrome, MPV)** are **not** inside Electron; orchestration and sessions are documented in [`docs/launch-sessions-and-windowing.md`](../../../docs/launch-sessions-and-windowing.md).

Do not reintroduce **Node** or arbitrary shell commands in the **renderer**; new launch paths go through the **API** and existing security model.

---

## Testing (required touchpoints)

Follow [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) scripts:

| Change type | Suggested check |
| --- | --- |
| API / C# | `dotnet test` or `npm test` from root; full solution when touching shared contracts |
| Launcher UI / TS | `npm --prefix launcher test` (Vitest) |
| Electron main / IPC / preload | `npm --prefix launcher run test:electron` |
| Pre-push / CI parity | `npm run verify` (ESLint + full test stack) |

Pure kiosk / fullscreen **guard** logic: covered by `window-fullscreen-kiosk-guard` tests; **main.cjs** is not unit-tested as a whole — see CONTRIBUTING for rationale.

---

## Commits, PRs, and formatting

- **Conventional Commits** optional but preferred: `feat(api):`, `fix(launcher):`, `docs:`, `chore:`, `refactor:`, `test:` (see `CONTRIBUTING.md`).
- **Format:** `dotnet format` for `api/` when editing C#; `npm --prefix launcher run format` (Prettier) for launcher when needed; `npm --prefix launcher run lint` before PR.
- **Secrets:** Never commit `.env`; use `.env.example` and `docs/environment.md`.

---

## What not to do (unless explicitly specified)

- Drive-by renames, broad refactors, or new state libraries unrelated to the task.
- Duplicating the **documentation index** outside [`README.md`](../../../README.md) / `docs/`.
- **Second** full design system indexes — this skill + `docs/design-system/` + `variables.css` are enough; update them instead of forking.
- Suggesting new cloud backends or scraping credentials — out of product scope (see `docs/project-plan.md`).

When uncertain, open the **nearest existing file** in the same layer (launcher component, endpoint, service) and **match it**.
