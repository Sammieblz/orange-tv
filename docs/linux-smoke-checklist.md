# Linux smoke checklist (Ubuntu VM)

Run this on an **Ubuntu 24.04** VM (or Linux host) after `npm run setup` and `npm run dev`—for example before a **release** or after **substantial launcher/API changes**—unless a row is marked **N/A** for the current milestone.

**Setup reference:** [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md)  
**Where this fits overall:** [`testing-matrix-v1.md`](testing-matrix-v1.md)

## How to use

- Aim for **~15 minutes** end-to-end once you are familiar with the steps.
- If a **P1** item is not implemented yet, mark it **N/A** and note why.
- Record **pass/fail/N/A** and the **commit SHA** in your release notes or issue tracker.

This checklist assumes **`npm run dev` runs inside the Ubuntu VM** (native Linux clone after `git pull` — see [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md)). Use **`localhost`** URLs below.

---

## P0 — Must pass (each full run)

### Launcher startup

- [ ] `npm run dev` starts the launcher process without immediate crash.
- [ ] Browser loads `http://localhost:5173/` (or the URL Vite prints) and the UI renders.
- [ ] Browser devtools show **no uncaught errors** on first load (warnings acceptable).

### API startup

- [ ] API listens on the expected URL (default `http://localhost:5144/` — see `api/Properties/launchSettings.json`).
- [ ] `GET /weatherforecast` returns **HTTP 200** and JSON.

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5144/weatherforecast
  ```

- [ ] `GET /api/v1/health` returns **HTTP 200** and JSON with **`status`** and **`database`** (SQLite control plane).

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5144/api/v1/health
  ```

- [ ] `GET /api/v1/system/platform` returns **HTTP 200** and JSON with **`isLinux: true`** (API runs in the VM).

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5144/api/v1/system/platform
  ```

### Cross-platform sanity

- [ ] `dotnet build api/OrangeTv.Api.csproj` succeeds **with dev servers stopped** (avoids locked exe on some setups).

---

## P1 — When the feature exists (enable rows as you ship)

### Fullscreen / kiosk (best effort in VM)

- [ ] Launcher can enter **fullscreen** (browser F11, or Electron when using `npm run dev:electron` with appliance/kiosk env — see [`electron-window-lifecycle.md`](electron-window-lifecycle.md)).
- [ ] With **Electron**, optional smoke: set `ORANGETV_ELECTRON__SHELL_PROFILE=appliance` or `ORANGETV_ELECTRON__KIOSK=true` and confirm the shell stays in a locked fullscreen/kiosk mode per [`electron-shell.md`](electron-shell.md) (no casual exit via renderer IPC).

**VM limitation:** Real appliance behavior (labwc, auto-login, no sleep) is **not** fully represented in a typical dev VM. See [Known limitations](#known-limitations-vm-vs-hardware).

### Launch sessions API and running apps dock

- [ ] `GET /api/v1/launch/sessions/active` returns **HTTP 200** and JSON with an **`items`** array (may be empty).

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5144/api/v1/launch/sessions/active
  ```

- [ ] After launching an external app from the launcher, **`items`** includes that session (or verify via API after `POST /api/v1/launch`).
- [ ] **Linux (expected):** `POST /api/v1/launch/sessions/{sessionId}/minimize` returns **501** — this is **expected** until a Linux window backend exists; it is **not** a regression. The dock may still list active sessions.
- [ ] Launcher UI shows the **Running apps** strip with operator notes (OS lock vs shell lock; Linux minimize limitations) when sessions exist or after load.

### Process launch (Chrome / MPV)

- [ ] From Orange TV, launching a **Chrome** or **MPV** tile starts a process (log or `ps` confirms).
- [ ] Launch uses **Linux-appropriate** paths and arguments (no Windows-only assumptions in API or scripts).

### Process recovery / return home

- [ ] After the external app **exits normally**, focus returns to the launcher within a **bounded time** (define an SLA in release criteria if you need a hard number, e.g. under 10 seconds).
- [ ] After **killing** the child process (`kill <pid>`), launcher recovers without a manual desktop intervention.

**VM limitation:** Focus stacking under Wayland vs X11 may differ from **hardware + TV**.

### Config persistence

- [ ] Change a **documented** setting (or env-driven flag) and restart API + launcher; value **persists** on disk under Linux paths.
- [ ] SQLite or config files live under paths documented for Linux (see `docs/environment.md`).

### Playback (local media)

- [ ] **MPV** (or chosen adapter) plays a **known sample file** from a path on the VM.
- [ ] Exit MPV; launcher **refreshes** “continue watching” or equivalent row if implemented.

**Skip** if MPV is not installed on the VM.  
**VM limitation:** VA-API / decode path may not match **mini PC**; treat decode quality as **hardware-primary**.

---

## P2 — Periodic or pre-release (not every run)

- [ ] Stream a **browser** shortcut session; confirm **profile persistence** across two launches (Chrome user-data-dir).
- [ ] **Controller** navigates shell and launches one item (if supported).
- [ ] **Soak:** 30+ minutes idle + one full navigation cycle without memory blow-up (optional metric).

---

## Known limitations (VM vs hardware)

| Topic | Ubuntu VM | Target hardware (mini PC + TV) |
| --- | --- | --- |
| GPU decode / HDR | Often partial or software path | **Full** validation expected |
| HDMI, hotplug, EDID | Not representative | **Hardware-only** |
| Thermals / power loss | N/A | **Hardware-only** |
| “10-foot” legibility | Approximate | **Hardware-primary** |
| Streaming service parity | Browser on Linux varies | **Best-effort** per product positioning |

For a cross-environment view, use [`testing-matrix-v1.md`](testing-matrix-v1.md).
