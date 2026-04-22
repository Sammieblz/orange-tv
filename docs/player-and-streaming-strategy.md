# Orange Player and in-shell streaming strategy

This document captures **product direction** and **engineering boundaries** for making playback and streaming shortcuts feel **native inside the Orange TV shell** (Electron TV app), similar in *spirit* to Jellyfin clients or Roku tiles—but within what is technically and commercially realistic for a **local mini-PC + Electron** stack.

**Tracking (Linear):** Epic [**SAM-50 — Orange TV: in-shell player + streaming (Roku-style UX)**](https://linear.app/samspot/issue/SAM-50/orange-tv-in-shell-player-streaming-roku-style-ux) with children:

- [**SAM-51** — Orange Player (owned & local library)](https://linear.app/samspot/issue/SAM-51/orange-player-embedded-in-shell-playback-for-owned-and-local-library)
- [**SAM-52** — Streaming shell (in-app web for Netflix / Prime / Disney+ shortcuts)](https://linear.app/samspot/issue/SAM-52/streaming-shell-in-app-browserview-for-netflixprimedisney-shortcuts)
- [**SAM-53** — Unified TV controls across shell, player, and web](https://linear.app/samspot/issue/SAM-53/tv-controls-unified-shortcut-map-for-shell-orange-player-and-streaming)

Use Linear for **breakdown, ordering, and acceptance criteria** as implementation proceeds; keep this file as the **stable architecture summary** and update it when decisions change.

---

## Two surfaces (do not conflate them)

| Surface | Role | Control of experience |
| --- | --- | --- |
| **Orange Player** | First-party playback for **your** media: indexed library files, optional sidecar formats, future Jellyfin-style sources **you** control. | **Full** — D-pad, play/pause, seek, back, overlays owned by Orange TV. |
| **Streaming shell** | Shortcuts to **third-party** catalogs (Netflix, Prime Video, Disney+, etc.) that require **DRM** and their own web apps. | **Partial** — shell owns **chrome** (fullscreen, return-to-home, profiles); **in-page** UX is still the service’s web app. |

Commercial streamers do **not** expose a small-indie “embed Netflix in my grid with my decoder” API the way Roku’s **partner SDK** does for platform licensees. The compliant DIY approach is: **their** web experience inside **your** Chromium-derived surface, plus strong **session** and **window** orchestration on your side.

---

## Orange Player (owned / local / server-you-control)

**Goal:** Users never leave the “Orange TV feels like one app” mental model for **local and self-hosted** playback.

**Implementation directions (spike in SAM-51):**

- **Embedded web player** — `<video>` / MSE for formats you fully control (limited vs MPV today).
- **Embedded native / libmpv** — stronger codec and subtitle story; more native work and packaging.
- **Orchestrated MPV** — keep process-based playback but tighten **lifecycle, focus, and UI chrome** so it feels in-product (stepping stone).

**Success looks like:** From a library or home row → fullscreen playback → **Back** returns to the launcher with no stray windows and predictable **focus**.

**Related docs today:** [`media-library.md`](media-library.md), [`launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md), [`electron-shell.md`](electron-shell.md).

---

## Streaming shell (Netflix-class shortcuts)

**Goal:** Tiles like “Netflix” open **inside** the Orange TV desktop app—not a separate ad-hoc Chrome install—using a **dedicated BrowserView** (or equivalent) with:

- **Persistent profiles** (align with existing **Chrome profile segment** / API settings model in [`chrome-profiles-and-backup.md`](chrome-profiles-and-backup.md)).
- **Kiosk / fullscreen** policy from [`electron-shell.md`](electron-shell.md) and [`electron-window-lifecycle.md`](electron-window-lifecycle.md).
- **Return-to-home** and **launch sessions** where still relevant for OS-level minimize/foreground ([`environment.md`](environment.md), [`launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md)).

**Hard constraints:**

1. **Widevine / DRM** stays inside **Chromium**; Orange TV does not decode Netflix streams in a custom player.
2. **Site behavior changes** — keyboard/gamepad mapping inside the page is **best-effort** and may regress when the service updates UI.
3. **Linux** — streaming in Chromium remains **best-effort** per product positioning ([`README.md`](../README.md), [`project-plan.md`](project-plan.md)).

**Success looks like:** One obvious “TV app” frame; streaming feels **anchored** to Orange TV even when the pixels are mostly the service’s web UI.

---

## Unified TV controls (SAM-53 / SAM-58 — shipped)

The contract is codified as a **pure module** plus unit tests and consumed by the launcher, Orange Player, and the future web-shell:

- **Module:** [`launcher/src/navigation/tvControlsContract.ts`](../launcher/src/navigation/tvControlsContract.ts)
- **Tests:** [`launcher/src/navigation/tvControlsContract.test.ts`](../launcher/src/navigation/tvControlsContract.test.ts)
- Related DOM / gamepad wiring: [`focus-navigation.md`](focus-navigation.md), [`gamepad-focus-recovery.md`](gamepad-focus-recovery.md).

### Surfaces × actions

| Action | `launcher` | `player` | `web-shell` |
| --- | --- | --- | --- |
| `up` / `down` / `left` / `right` | **shell** | **shell** | delegated |
| `confirm` | **shell** | **shell** | delegated |
| `back` | **shell** (→ sidebar) | **shell** (→ launcher) | **shell** (→ launcher) |
| `play-pause` / `seek-forward` / `seek-back` | ignored | **shell** | delegated |
| `home` / `menu` | **shell** | **shell** | **shell** |

- **shell** = Orange TV handles the key itself.
- **delegated** = key is forwarded to the embedded page / video element.
- **ignored** = deliberately a no-op on that surface.

The rule for the web-shell is **"delegate content keys, always capture Back and Home"** so the user can never be stranded inside a streaming site.

## Orange Player — `<video>` spike (SAM-56 — shipped)

Implementation:

- Reducer: [`launcher/src/player/orangePlayerReducer.ts`](../launcher/src/player/orangePlayerReducer.ts) — pure state machine for `idle → loading → playing/paused/ended/error`, seek clamping, and TV-action → player-event mapping.
- Component: [`launcher/src/player/OrangePlayer.tsx`](../launcher/src/player/OrangePlayer.tsx) — HTML5 `<video>` inside a focused region; consumes `tvControlsContract` to decide which keys to capture vs let through.
- Tests: [`launcher/src/player/orangePlayerReducer.test.ts`](../launcher/src/player/orangePlayerReducer.test.ts), [`launcher/src/player/OrangePlayer.test.tsx`](../launcher/src/player/OrangePlayer.test.tsx).

Limits: codec support is whatever Electron's Chromium provides; DRM is **not** a goal here. For the recommendation about libmpv / helper-process extensions, see [`libmpv-feasibility.md`](libmpv-feasibility.md) (SAM-55).

## MPV stepping stone (SAM-59 — shipped)

Until Orange Player replaces the orchestrated MPV path entirely, the existing "spawn MPV as a child process" flow is hardened:

- [`launcher/src/launchFromTileActivate.ts`](../launcher/src/launchFromTileActivate.ts) now **clears the pending shell-focus checkpoint on launch failure** so a failed launch cannot leave a stale `focusCheckpoint` that would be silently consumed by a later unrelated window-focus event.
- New unit coverage in [`launcher/src/launchFromTileActivate.test.ts`](../launcher/src/launchFromTileActivate.test.ts) asserts:
  - success path keeps the checkpoint armed,
  - `ok: false` and thrown-error paths clear the checkpoint.

The dock's "Minimize → `focusShell()`" behavior in [`RunningAppsDock.tsx`](../launcher/src/components/RunningAppsDock/RunningAppsDock.tsx) is unchanged and remains the canonical return-to-shell path.

## Streaming shell — BrowserView wiring (SAM-61 — shipped)

Streaming tiles render as an in-Electron **`BrowserView`** attached to the shell window **by default** — no separate Chrome process, no title bar, no taskbar entry, no drag-out. The in-window path is controlled by **`ORANGETV_ELECTRON__WEB_SHELL_ENABLED`**; set it to `0` or `false` to fall back to the legacy external-Chrome path for debugging.

**Runtime hardening (applied to every streaming BrowserView):**

- **User-agent normalized** via [`web-shell-useragent.cjs`](../launcher/electron/web-shell-useragent.cjs) so sites do not see `Electron/<version>` and throw "download our app" modals.
- **`window.open` / `target="_blank"` denied** via `webContents.setWindowOpenHandler` — nothing can escape as a second OS window.
- **Top 44px inset** reserved for the launcher's [`WebShellTopBar`](../launcher/src/player/WebShellTopBar.tsx), a discoverable Back control that renders over the shell window whenever a BrowserView is active. Escape / Backspace / Home still work via `classifyWebShellKey`.

**Startup logs:** when the in-window path is active, main logs `INFO app ready { ..., "webShellEnabled": true }` + `INFO web_shell_enabled`; the renderer DevTools console logs each tile's routing decision (`web-shell` vs `external`).

### Architecture

| Layer | Source |
| --- | --- |
| **Pure geometry / URL allow-list / key guard** | [`launcher/electron/web-shell-container.cjs`](../launcher/electron/web-shell-container.cjs) |
| **Per-tile persistent partitions** (mirrors `ChromeProfilePaths.SanitizeSegment`) | [`launcher/electron/web-shell-profile.cjs`](../launcher/electron/web-shell-profile.cjs) |
| **Lifecycle state machine (DI-friendly, no Electron import)** | [`launcher/electron/web-shell-manager.cjs`](../launcher/electron/web-shell-manager.cjs) |
| **Electron glue (main.cjs)** | `createElectronWebShellDeps` + IPC handlers in [`launcher/electron/main.cjs`](../launcher/electron/main.cjs) |
| **IPC channels** | `WEB_SHELL_OPEN` / `WEB_SHELL_CLOSE` / `WEB_SHELL_STATE` in [`launcher/electron/ipc-contract.cjs`](../launcher/electron/ipc-contract.cjs) |
| **Payload validation** | `validateWebShellOpenPayload` in [`launcher/electron/ipc-payload.cjs`](../launcher/electron/ipc-payload.cjs) |
| **Preload bridge** | `openWebShell` / `closeWebShell` / `onWebShellState` in [`launcher/electron/preload-bridge.cjs`](../launcher/electron/preload-bridge.cjs) |
| **Renderer route decision** | `decideStreamingLaunchRoute` in [`launcher/src/player/streamingLaunchRoute.ts`](../launcher/src/player/streamingLaunchRoute.ts) |
| **Renderer hook** | `useWebShell` / `useWebShellState` in [`launcher/src/player/useWebShell.ts`](../launcher/src/player/useWebShell.ts) |
| **Tile integration** | `launchAppTileIfActivated` + `LauncherPage` pass `webShellEnabled` + `resolveApp` ([`launcher/src/launchFromTileActivate.ts`](../launcher/src/launchFromTileActivate.ts), [`launcher/src/LauncherPage.tsx`](../launcher/src/LauncherPage.tsx)) |

### Flow

1. On startup the launcher calls `window.orangeTv.getRuntimeMetadata()` and reads `webShellEnabled`.
2. When a streaming tile is activated, `decideStreamingLaunchRoute` inspects the app record (type = `chrome`, non-empty `launchUrl`). On `web-shell`, the renderer calls `window.orangeTv.openWebShell(...)`.
3. Main validates the payload, resolves the `persist:<segment>` session, creates a `BrowserView` inside the shell window, applies fullscreen bounds, installs the `before-input-event` key guard, and loads the URL. State is broadcast to the renderer on `WEB_SHELL_STATE`.
4. `Escape` / `Backspace` / `Home` / `ContextMenu` inside the view are captured, close the view, and refocus the shell — never stranding the user inside streaming content.
5. If the flag is **off**, `openWebShell` returns `web-shell-disabled` and the launcher transparently falls back to the legacy `POST /api/v1/launch` → external Chrome path.

### Key rule

**Chromium stays.** Orange TV does not replace the browser engine — commercial streamers require Widevine DRM which only ships in Chromium/Chromecast/Firefox. The win here is that the Chromium surface lives **inside** Orange TV's window (fullscreen, Back-captured, per-tile session), not as a spawned separate desktop application.

### Tests (all wired into `npm run test:electron` / `npm test`)

- `web-shell-manager.test.cjs` — 14 cases covering open/close/resize/partition/key-guard/error paths/dispose
- `web-shell-container.test.cjs`, `web-shell-profile.test.cjs` — lower-level pure modules
- `ipc-payload.test.cjs` — adds `validateWebShellOpenPayload` coverage
- `ipc-contract.test.cjs`, `preload-bridge.test.cjs` — contract + new bridge keys
- `streamingLaunchRoute.test.ts` — pure decision function (8 cases)
- `launchFromTileActivate.test.ts` — integration: web-shell path wins on flag-on, falls back on flag-off / `ok:false` / thrown errors

---

## Relationship to current codebase (v1.0.0)

Today the API launches **Chrome** and **MPV** as separate OS processes (`ProcessLaunchService`); the API can also run **BrowserShell** for dev. This strategy **does not remove** those paths overnight; it describes **where we want to converge**:

1. **Orange Player** absorbs **local** playback UX priority.
2. **Streaming shell** replaces “spawn Chrome” for shortcuts with **in-Electron web** where feasible.
3. **Launch sessions** remain the truth for “what is running” until architecture simplifies.

---

## Working agreement

- **Linear** = execution board (issues, ordering, done criteria).
- **This doc** = agreed architecture and constraints; edit when the team changes direction.

When closing milestones in Linear, update this document’s **Implementation directions** or **Success looks like** sections so new contributors read one honest source.
