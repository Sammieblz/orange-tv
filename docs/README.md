# Orange TV documentation index

Use this map to find operator, contributor, and architecture docs. The repo root [`README.md`](../README.md) links here for discoverability.

## Shell and Electron

| Doc | Topics |
| --- | --- |
| [`electron-shell.md`](electron-shell.md) | Preload API, IPC channels, security model, kiosk IPC lock, `focusShell`, OS-wide lock vs shell lock |
| [`electron-window-lifecycle.md`](electron-window-lifecycle.md) | Window creation, dev vs appliance/kiosk, F11, blur/focus |
| [`gamepad-focus-recovery.md`](gamepad-focus-recovery.md) | Shell foreground events, focus recovery after external apps |

## Control plane and API

| Doc | Topics |
| --- | --- |
| [`environment.md`](environment.md) | Env vars (API + Electron), local HTTP endpoints including launch sessions |
| [`launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md) | Launch sessions, minimize/foreground, Windows vs non-Windows behavior |

## Setup and platforms

| Doc | Topics |
| --- | --- |
| [`local-setup-windows.md`](local-setup-windows.md) | Windows dev, Chrome paths, Electron |
| [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md) | Ubuntu VM, BrowserShell, paths |

## Validation and quality

| Doc | Topics |
| --- | --- |
| [`testing-matrix-v1.md`](testing-matrix-v1.md) | Windows vs Ubuntu VM vs hardware expectations |
| [`linux-smoke-checklist.md`](linux-smoke-checklist.md) | Sprint gate checks on Linux |

## Product and roadmap

| Doc | Topics |
| --- | --- |
| [`project-plan-v1.2.md`](project-plan-v1.2.md) | Full-scope plan, delivery sequencing, risks |

## Feature-specific

| Doc | Topics |
| --- | --- |
| [`focus-navigation.md`](focus-navigation.md) | TV-style keyboard focus |
| [`chrome-profiles-and-backup.md`](chrome-profiles-and-backup.md) | Chrome profile storage |
| [`media-library.md`](media-library.md) | Local media scanning |
| [`watch-history.md`](watch-history.md) | Watch events and resume |
| [`recommendations-rules.md`](recommendations-rules.md) | Rules-based recommendations |
