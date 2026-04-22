# libmpv / native helper feasibility for Orange Player

**Linear:** [SAM-55](https://linear.app/samspot/issue/SAM-55/orange-player-spike-libmpv-native-helper-feasibility-packaging-ipc)
**Context:** [`player-and-streaming-strategy.md`](player-and-streaming-strategy.md) → *Orange Player*

This note captures the feasibility recommendation from the sprint spike so we do not relitigate it later. No libmpv binding is shipped in this sprint — this is a documented decision.

## Options considered

| Option | Playback engine | Where it runs | Pros | Cons |
| --- | --- | --- | --- | --- |
| **A. HTML5 `<video>` in renderer** | Chromium (Electron) | Renderer | Zero packaging; DRM-free formats work today; test harness with `vitest` + jsdom is straightforward; fits `tvControlsContract` cleanly. | Codec coverage is Chromium only (no `mkv`, limited subtitles, patchy HEVC). No hardware-decode tuning we control. |
| **B. libmpv bindings (N-API addon)** | MPV (`libmpv`) | Renderer or helper | Best codec + subtitle story; matches current MPV UX. | Native addon must be rebuilt per **Electron ABI** + per OS/arch; CI/packaging grows; renderer privilege risk unless confined. |
| **C. Helper process + IPC** | MPV (child process) | Separate process | Clean security boundary (renderer stays sandboxed); reuses today's `ProcessLaunchService` pattern. | Extra IPC layer; precise frame timing still comes from MPV's own window unless we render via shared surface. |

## Recommendation (this sprint)

**Ship (A)** — an in-renderer HTML5 `<video>` spike — as [`launcher/src/player/OrangePlayer.tsx`](../launcher/src/player/OrangePlayer.tsx) with a pure reducer in [`launcher/src/player/orangePlayerReducer.ts`](../launcher/src/player/orangePlayerReducer.ts). This proves the in-shell UX (focus, Back, play/pause, seek) without any native packaging work.

**Plan for (C)** — not (B) — when codec gaps actually block users. The helper-process path keeps the renderer sandboxed (matches Orange TV security model in [`electron-shell.md`](electron-shell.md) and the `orange-tv-design-system` skill) and reuses the **launch sessions** data model in [`launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md) for lifecycle tracking, so it is the incremental extension of what ships today.

**Do not ship (B)** by default: pulling libmpv into the renderer as an N-API addon breaks the **"no native code in the renderer"** rule without a reviewed exemption.

## Security / packaging constraints (apply to B and C)

- Electron renderer must stay `contextIsolation: true`, `nodeIntegration: false`. Any libmpv binding runs in **main** or in a **helper process** — never via `require('mpv')` from React.
- Native addons are rebuilt per Electron ABI (`electron-rebuild` or similar) and shipped per OS/arch. CI must matrix at least `win-x64` and `linux-x64` before we rely on it.
- Linux packaging needs to cover **Wayland (`labwc`) + PipeWire** audio. libmpv + VA-API is the happy path; software decode is acceptable as a fallback but must be called out in `docs/testing-matrix-v1.md`.
- Rendering strategy for (C): keep MPV's own window while we prototype; move to texture-sharing (MPV render API, `--wid`, or an OS-specific composition path) only after the child-process approach is validated end-to-end.

## Exit criteria before opening (C)

1. HTML5 `<video>` path ships and is documented in `player-and-streaming-strategy.md`.
2. At least one concrete user-facing codec gap is observed on real media (file + environment recorded in the issue).
3. Linux smoke checklist (`docs/linux-smoke-checklist.md`) runs cleanly for local playback under option (A).
4. A new Linear child issue captures packaging + IPC design before any native code lands.

## Related

- [`project-plan.md`](project-plan.md) — long-form architecture
- [`player-and-streaming-strategy.md`](player-and-streaming-strategy.md) — two-surface model
- [`.cursor/skills/orange-tv-design-system/SKILL.md`](../.cursor/skills/orange-tv-design-system/SKILL.md) — security non-negotiables
