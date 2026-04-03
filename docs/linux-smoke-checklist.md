# Linux smoke checklist (Ubuntu VM — sprint gate)

Run this at **the end of each sprint** on an **Ubuntu 24.04** VM (or Linux host) after `npm run setup` and `npm run dev`, unless a row is marked **N/A** for the current milestone.

**Setup reference:** [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md)  
**Where this fits overall:** [`testing-matrix-v1.md`](testing-matrix-v1.md)

## How to use

- Aim for **~15 minutes** end-to-end once you are familiar with the steps.
- If a **P1** item is not implemented yet, mark it **N/A** and note the sprint.
- Record **pass/fail/N/A** and the **commit SHA** in your sprint notes or ticket.

This checklist assumes **`npm run dev` runs inside the Ubuntu VM** (native Linux clone after `git pull` — see [`local-setup-ubuntu-vm.md`](local-setup-ubuntu-vm.md)). Use **`localhost`** URLs below.

---

## P0 — Must pass (every sprint)

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

- [ ] `GET /api/v1/system/platform` returns **HTTP 200** and JSON with **`isLinux: true`** (API runs in the VM).

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5144/api/v1/system/platform
  ```

### Cross-platform sanity

- [ ] `dotnet build api/OrangeTv.Api.csproj` succeeds **with dev servers stopped** (avoids locked exe on some setups).

---

## P1 — When the feature exists (enable rows as you ship)

### Fullscreen / kiosk (best effort in VM)

- [ ] Launcher can enter **fullscreen** (browser F11 or app fullscreen when Electron exists).
- [ ] No obvious **desktop chrome** required for basic navigation (N/A until Electron/kiosk shell exists).

**VM limitation:** Real appliance behavior (labwc, auto-login, no sleep) is **not** fully represented in a typical dev VM. See [Known limitations](#known-limitations-vm-vs-hardware).

### Process launch (Chrome / MPV / RetroArch)

- [ ] From Orange TV, launching the configured **external app** starts a process (log or `ps` confirms).
- [ ] Launch uses **Linux-appropriate** paths and arguments (no Windows-only assumptions in API or scripts).

**N/A** until launch orchestration is wired end-to-end.

### Process recovery / return home

- [ ] After the external app **exits normally**, focus returns to the launcher within a **bounded time** (define SLA in sprint, e.g. under 10 seconds).
- [ ] After **killing** the child process (`kill <pid>`), launcher recovers without a manual desktop intervention.

**VM limitation:** Focus stacking under Wayland vs X11 may differ from **hardware + TV**.

### Config persistence

- [ ] Change a **documented** setting (or env-driven flag) and restart API + launcher; value **persists** on disk under Linux paths.
- [ ] SQLite or config files live under paths documented for Linux (see `docs/environment.md`).

**N/A** until persistence feature exists.

### Playback (local media)

- [ ] **MPV** (or chosen adapter) plays a **known sample file** from a path on the VM.
- [ ] Exit MPV; launcher **refreshes** “continue watching” or equivalent row if implemented.

**N/A** until MPV integration exists.  
**VM limitation:** VA-API / decode path may not match **mini PC**; treat decode quality as **hardware-primary**.

---

## P2 — Periodic or pre-release (not every sprint)

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
