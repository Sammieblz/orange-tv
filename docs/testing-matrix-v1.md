# Testing matrix v1 (Windows · Ubuntu VM · hardware)

**Version:** 1  
**Purpose:** Map **where** each class of check is authoritative, **partial**, or **not applicable**, so Linux VM checks do not over-claim coverage or miss hardware-only risks.

**Ubuntu Linux gate:** [`linux-smoke-checklist.md`](linux-smoke-checklist.md)

## Legend

| Symbol | Meaning |
| --- | --- |
| **Full** | Primary environment for this check; failures block release for that tier. |
| **Partial** | Useful signal; known gaps or approximations — document in notes. |
| **N/A** | Not meaningful in this environment (yet). |

---

## Matrix

| Theme | Windows dev workstation | Ubuntu VM | Target mini PC + TV |
| --- | --- | --- | --- |
| **Repo bootstrap** | Full — `npm run setup`, `npm run dev` | Full — same commands on Linux | Partial — appliance image may use different install path |
| **Launcher startup (Vite / Electron)** | Full | Full | Full |
| **API startup + HTTP contracts** | Full | Full | Full |
| **Platform / OS awareness** | Full (`isWindows`) | Full (`isLinux`) | Full |
| **Fullscreen / kiosk / no desktop leak** | Partial — dev desktop | Partial — VM display stack | **Full** — labwc / appliance session |
| **External process launch** (Chrome, MPV) | Full — path quirks | Full — Linux argv/env | **Full** — real packages + permissions |
| **Launch sessions + running apps dock** (`GET .../launch/sessions/active`) | Full | Full | Full |
| **OS minimize / foreground** (`POST .../minimize`, `.../foreground`) | **Full** — Win32 orchestration | **Partial** — API returns **501**; list endpoint still works | **Partial** until Linux backend — same as VM |
| **Return to launcher / focus recovery** | Partial | Partial | **Full** |
| **Config + env persistence** | Full | Full | **Full** — paths + permissions + reboot |
| **SQLite / local DB** | Full | Full | **Full** — WAL, disk, backup |
| **Local playback (decode)** | Partial | Partial — GPU may differ | **Full** — VA-API, thermals |
| **Browser streaming sessions** | Partial | Partial — Linux service variance | **Full** — living-room conditions |
| **Controller input** | Partial | Partial | **Full** |
| **HDMI / display modes** | N/A | N/A | **Full** |
| **Wake / sleep / unplug** | N/A | N/A | **Full** |
| **OTA / rollback / safe mode** | N/A | Partial — when implemented | **Full** |

---

## Known limitations (explicit)

1. **Ubuntu VM** is the **first Linux gate**, not a substitute for **TV distance**, **HDMI**, or **GPU** behavior on the mini PC.
2. **Windows** remains the **fastest inner loop**; Linux failures may be environment-specific — reproduce on Ubuntu before closing “Linux-only” bugs.
3. **Streaming** quality and DRM behavior are **best-effort** on Linux; matrix marks them **Partial** until per-service acceptance is defined.
4. **Minimize/foreground** on Linux VM returns **501** from the API by design today; the **session list** endpoint is still the authority for “what is running.” See [`launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md).
5. **v1** is a **living document** — bump version when columns change (e.g. add “staging appliance image”).

---

## Related docs

- [`launch-sessions-and-windowing.md`](launch-sessions-and-windowing.md) — session HTTP API and platform behavior
- [`local-setup-windows.md`](local-setup-windows.md)
- [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md)
- [`linux-smoke-checklist.md`](linux-smoke-checklist.md)
- [`project-plan.md`](project-plan.md)
