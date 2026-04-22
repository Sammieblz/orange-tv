---
name: orange-tv-frontend
description: Build or modify the Orange TV launcher frontend, Electron shell, and TV-first UI. Use this skill when working on React components, Electron shell behavior, preload bridges, focus navigation, gamepad input, GSAP motion, TanStack Query data hydration, CSS Modules, launch flows to Chrome/MPV/RetroArch, return-to-home behavior, or any 10-foot living-room UX for the Orange TV appliance.
compatibility: Designed for Cursor Agent Skills. Assumes a Linux appliance product using Electron 31+, React 18, Vite 5, Zustand, TanStack Query, GSAP 3, CSS Modules, Iconoir, and a localhost backend/local host service.
metadata:
  project: Orange TV
  layer: frontend
  product-surface: launcher-shell
  version: "1.0"
---

# Orange TV Frontend Skill

## Mission
Orange TV is a Linux-based living-room appliance. The frontend must feel like a fast, resilient, TV-first launcher rather than a desktop app. The UI should prioritize:

1. **Appliance behavior first**: boot to the launcher, hide desktop complexity, and always provide a clear return path home.
2. **Local-first premium UX**: local media, resume points, artwork, and game launch flows should feel polished.
3. **Best-effort browser streaming**: optimize clean launch behavior, persistent sign-in state, and graceful recovery, without pretending Linux browser streaming is identical to dedicated commercial streaming boxes.
4. **Reliability before novelty**: crash recovery, focus restoration, and fast repaint on return are core behavior, not polish.

## When to use this skill
Use this skill when the task involves any of the following:

- Building or modifying the Orange TV launcher UI.
- Changing the Electron shell or preload bridge.
- Implementing or fixing D-pad, keyboard, or controller navigation.
- Adding or refining home rows, hero banners, overlays, settings, search, local media views, or game views.
- Wiring the renderer to backend launch APIs or process-state events.
- Improving launch-to-return flows for Chrome, MPV, or RetroArch.
- Implementing animations, focus states, lazy row rendering, or TV-safe layout behavior.
- Refactoring the codebase to preserve the boundary between React UI, Electron shell, and backend/local service.

Do **not** use this skill as the primary guide for backend schema design, worker schedules, or operational services. For those tasks, use the Orange TV backend/API skill.

---

# Product and UX principles

## Non-negotiable UX rules
- The interface is **focus-driven**, not hover-driven.
- The product is designed for **10-foot viewing** from a couch.
- Directional movement must feel coherent across the sidebar, hero, rows, overlays, and settings.
- Every launch action must have an equally dependable **return-to-home** path.
- Any external process exit, crash, or focus loss should restore the launcher quickly.
- Transitions should feel authored and premium, but they must never delay input or make the UI feel heavy.

## Visual direction
Orange TV is dark, content-forward, and cinematic, with orange used sparingly for focus, active states, and brand recognition.

### Core visual tokens
Use these as defaults unless a task explicitly changes them:

```css
:root {
  --color-bg: #0A0A0A;
  --color-surface: #141414;
  --color-surface-mid: #1E1E1E;
  --color-orange: #FF6B00;
  --color-orange-glow: #FF8C38;
  --color-text: #FFFFFF;
  --color-muted: #A0A0A0;
  --focus-ring: 0 0 0 3px #FF6B00, 0 0 20px rgba(255,107,0,0.4);
  --transition-fast: 120ms ease-out;
  --transition-medium: 240ms ease-out;
  --radius-tile: 12px;
  --radius-card: 8px;
}
```

## Layout shell
The consistent shell across screens is:
- **Left rail/sidebar**: collapsed icon-first nav, expandable on focus.
- **Hero**: full-bleed or wide banner with readable left-side text overlay.
- **Rows**: horizontally scrollable lists of streaming apps, continue-watching, recent, recommended, or games.
- **Overlays/settings/search**: still feel like part of the same shell, not a separate app.

## Focus behavior
Preferred defaults:
- Focused element scales to about `1.08`.
- Focus ring uses orange glow and subtle brightness shift.
- Motion stays transform/opacity-based.
- Focus state should be obvious without being visually noisy.

## Timing guidance
- Focus transitions: around `120–150ms`.
- Sidebar expand: around `200ms`.
- Hero transition: around `600ms`.
- Keep all input handling responsive. Never block navigation waiting for animations.

---

# Architecture boundaries

This is critical. Do not blur these concerns.

## Electron shell owns
- Fullscreen window creation.
- Window lifecycle and restart-safe behavior.
- Navigation guards.
- Minimal trusted preload bridge.
- IPC allowlisting and payload validation.
- Process-state events from the backend/local service.
- Return-to-home behavior after external app exit.
- Crash-screen presentation and recovery-safe fallback.

## React UI owns
- Screen composition and rendering.
- Sidebar, hero, rows, tiles, overlays, search, settings, media, music, and games views.
- Focus model and navigation logic.
- Presentation state.
- Immediate renderer-side response to launch and process lifecycle events.
- Background hydration/refetch of server state.

## Backend/local host service owns
- Actual process launch orchestration.
- Filesystem scanning and metadata.
- Persistent history, resume points, settings, diagnostics, and health.
- App/media/game state persistence.

## Hard boundary rules
- The renderer must **never launch arbitrary local processes directly**.
- The renderer must go through the preload bridge and Electron shell.
- Electron should forward launch requests to the backend/local host service instead of embedding launch logic in the renderer.
- Do not treat Electron like a general-purpose browser.
- Do not expose Electron internals to remote content.

---

# Preferred frontend stack

Use these defaults unless the repo clearly differs and the task specifically requires adaptation:

- **Shell**: Electron 31+ in fullscreen / kiosk-oriented mode.
- **Frontend framework**: React 18.
- **Build tool**: Vite 5.
- **Styling**: CSS variables + CSS Modules.
- **Animation**: GSAP 3.
- **Client state**: Zustand.
- **Server state**: TanStack Query.
- **Icons**: Iconoir SVGs.
- **Fonts**: bundled local fonts such as Plus Jakarta Sans and Inter.

Avoid introducing Tailwind, a CSS-in-JS rewrite, or heavy component frameworks unless the task explicitly calls for a stack change.

---

# Expected workspace shape

Prefer this structure when adding or reorganizing frontend code:

```text
launcher/
  electron/
    main.js            # BrowserWindow lifecycle, IPC handlers, navigation guards
    preload.js         # contextBridge allowlist
  src/
    components/
      Sidebar/
      Hero/
      Row/
      Tile/
      FocusRing/
      Overlay/
      Search/
      Settings/
    hooks/
      useNavigation.js
      useLaunch.js
      usePlayerState.js
      useGamepad.js
    store/
      focusStore.js
      playbackStore.js
      settingsStore.js
      shellStore.js
    api/
      apps.js
      media.js
      history.js
      settings.js
      system.js
    styles/
      variables.css
      reset.css
    App.jsx
```

When implementing a new feature, place code according to responsibility, not convenience.

---

# Navigation and input model

## Golden rule
Orange TV navigation is a **2D focus grid** shared across keyboard and gamepad input.

## Required behavior
- Arrow keys and D-pad update the same `(row, col)` position model.
- `Enter` / primary action launches or activates the focused item.
- `Escape` / Back returns to the previous shell state.
- Sidebar expansion should be driven by focus, not by mouse hover assumptions.
- Horizontal row movement should preserve momentum and avoid layout thrash.
- Overlay/dialog focus should trap correctly, then restore focus when closed.

## Baseline hook shape
Use or preserve a pattern close to this:

```js
export function useNavigation(layout) {
  const [pos, setPos] = useState({ row: 0, col: 0 });

  useEffect(() => {
    const onKey = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          moveFocus(-1, 0);
          break;
        case 'ArrowDown':
          moveFocus(+1, 0);
          break;
        case 'ArrowLeft':
          moveFocus(0, -1);
          break;
        case 'ArrowRight':
          moveFocus(0, +1);
          break;
        case 'Enter':
          launchFocused();
          break;
        case 'Escape':
          goBack();
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layout]);
}
```

## Navigation quality bar
When modifying navigation:
- Preserve directional intuition.
- Prevent dead ends unless intentional.
- Clamp invalid indices safely.
- Support variable row lengths.
- Restore focus after data refresh.
- Avoid remounting focused tiles unnecessarily.
- Keep row virtualization/lazy rendering from breaking focus.

---

# Animation strategy

Use GSAP for complex authored motion, but keep the motion system disciplined.

## Good animation usage
- Focus scale/glow.
- Hero crossfades and text reveals.
- Sidebar width/label reveal.
- Modal open/close choreography.
- Boot/splash timeline.
- Smooth transform-based row motion.

## Do this
- Animate `transform` and `opacity` first.
- Reuse a consistent easing vocabulary.
- Keep motion short and purposeful.
- Make focus movement feel snappy and deterministic.

## Avoid this
- Layout thrashing animations.
- Long or theatrical transitions on routine navigation.
- Animations that delay user input.
- Per-frame state churn inside React render paths.

---

# State management model

## Zustand is for
- Focus position.
- Current row / current screen.
- Playback shell state.
- Shell UI state.
- User preferences that affect presentation.

## TanStack Query is for
- Apps row data.
- Continue Watching.
- Recently Played.
- Media library lists.
- Games rows.
- Settings or diagnostics that come from the backend.

## Guidance
- Keep client state and server state conceptually separate.
- Do not use Zustand as a shadow server cache.
- Use invalidation or refetch on return from external processes.
- Favor optimistic presentation only when it is safe and quickly reconcilable.
- Make some components reusable

---

# Launch flow contract

The frontend must respect this pipeline:

1. React raises a typed launch request.
2. The preload bridge exposes a narrow trusted API.
3. Electron validates and forwards the request.
4. Electron sends the request to the backend/local host service.
5. The backend constructs the final command and launches Chrome, MPV, or RetroArch.
6. The backend tracks the session and emits completion/process-state events.
7. Electron restores the launcher window after exit.
8. The frontend refreshes rows such as Continue Watching, Recently Played, or Top Apps.

## Preferred launch payload pattern
Use clear, typed intent shapes such as:

```ts
type LaunchIntent =
  | { type: 'streaming'; appId: string; url: string }
  | { type: 'media'; mediaId: string; filePath: string; resumeSeconds?: number }
  | { type: 'music'; trackId: string; filePath: string }
  | { type: 'game'; gameId: string; romPath: string; core?: string };
```

## Frontend responsibilities during launch
- Show immediate visual acknowledgement.
- Avoid duplicate launches from repeated input spam.
- Disable or debounce repeated launch while the request is in-flight.
- Surface recoverable errors in a TV-appropriate, low-friction way.
- Restore focus and repaint state after process exit.

---

# Security defaults

These are default shell rules and should be preserved unless there is a compelling, documented reason to change them:

- `contextIsolation: true`
- `nodeIntegration: false`
- sandboxed renderers
- narrow `contextBridge` preload API
- allowlisted IPC channels only
- validate payload shapes before actioning them
- treat remote web content as untrusted
- do not expose Electron internals to remote content

If a task suggests bypassing these rules for convenience, do not do it unless the request explicitly includes an approved architectural change.

---

# Screen-specific guidance

## Home screen
Must feel fast, premium, and stable.
- Prioritize fast first paint.
- Preserve hero + rows shell consistency.
- Keep row labels readable at TV distance.
- Use badges only when they help decisions: progress, signed-in hint, stale-session hint, save-state, last played.

## Streaming apps row
- Square or rounded-square tiles.
- Signed-in or stale-session hints are okay if sourced from backend state.
- Do not imply guaranteed streaming parity across Linux services.

## Local media rows
- Use wide cards or 16:9 tiles.
- Support progress bars and resume affordances.
- Artwork quality matters.
- Continue Watching should refresh immediately on return from playback.

## Games rows
- Show platform, artwork, last-played metadata, and save-state awareness where available.
- Controller navigation should feel identical to shell navigation.

## Settings
- Focus should remain simple and recoverable.
- Session backup/restore, profile paths, library roots, feature flags, and diagnostics exports belong here if exposed by backend.

---

# Session persistence UX rules

Chrome session persistence comes from fixed profile directories on disk, not from Orange TV storing credentials. The UI can surface session-related hints, but it must not cross privacy boundaries.

## Allowed
- Show “Signed In”, “Last Used”, or “May Need Sign-In” hints if provided by backend state.
- Show first-launch guidance such as “Sign in once and stay signed in automatically.”
- Provide explicit session backup/restore entry points when supported by backend.

## Forbidden
- Reading or scraping browser cookie databases.
- Storing passwords or tokens.
- Suggesting that the app can auto-submit logins.
- Treating session state as guaranteed if the backend marks it stale or unknown.

---

# Recommended implementation workflow for agent tasks

When using this skill, follow this order unless the task clearly requires a different sequence:

1. **Identify the layer**: React, Electron shell, preload bridge, or cross-layer integration.
2. **Preserve boundaries**: do not solve a shell or backend problem in the renderer.
3. **Inspect existing state/data flow**: Zustand stores, TanStack Query hooks, preload API, and IPC contracts.
4. **Plan the focus impact**: every UI change should consider D-pad navigation and return-to-home behavior.
5. **Implement with TV constraints in mind**: font scale, target size, readability, motion, and recovery.
6. **Verify the process lifecycle** if the feature launches external apps.
7. **Check failure modes**: missing artwork, stale data, backend unavailable, process exit, lost focus, or interrupted launch.
8. **Keep diffs cohesive**: avoid mixing unrelated architecture rewrites into a focused task.

---

# Definition of done for frontend changes

A frontend task is not done until most of the following are true:

- The change respects the Electron/React/backend boundary.
- Keyboard and controller navigation still work.
- Focus restore is correct after overlays, route changes, or process return.
- Renderer does not directly launch local processes.
- Launch state and return-to-home behavior are wired correctly.
- Query invalidation/refetch is handled where process state changes the UI.
- Styling matches Orange TV design language.
- Motion feels responsive and does not block input.
- Edge cases are handled gracefully.
- Code is organized into the expected shell/component/hook/store/api structure.

---

# Common anti-patterns to reject

Reject or refactor approaches that do any of the following:

- Put process launch logic inside React components.
- Expose broad shell or filesystem access through preload.
- Use mouse-hover assumptions in a TV interface.
- Introduce Tailwind or a new UI framework for a narrow task with no project-wide justification.
- Store remote data in multiple competing state systems.
- Use long-running animations that hurt navigation.
- Break return-to-home behavior by ignoring process lifecycle events.
- Overload the hero or tiles with dense metadata that harms readability.
- Treat the product like a generic desktop dashboard instead of a living-room appliance.

---

# Output style for the agent

When carrying out a task with this skill, the agent should:

- Make boundary-preserving changes.
- Prefer small, verifiable edits over sweeping speculative rewrites.
- Explain how navigation, launch flow, and return-to-home behavior are preserved.
- Mention any backend contract assumptions explicitly.
- Call out when a requested change would violate TV UX, security, or architecture constraints.

---

# Quick reference checklist

## If the task is UI-only
- Does it preserve 10-foot readability?
- Does focus still work?
- Are animations transform-based and short?
- Is state ownership clean?

## If the task touches Electron
- Is the preload bridge minimal?
- Are IPC channels allowlisted?
- Is the renderer still sandboxed?
- Does return-to-home still work?

## If the task touches launch behavior
- Is React sending typed launch intent?
- Is Electron forwarding, not launching directly from renderer?
- Is backend/local service still the command authority?
- Is UI refreshed after process exit?

## If the task touches session UX
- Are privacy boundaries preserved?
- Is session status treated as hinting, not credential management?
- Are backup/restore affordances explicit and safe?

This skill should make the agent behave like a disciplined Orange TV launcher engineer, not a generic web app coder.
