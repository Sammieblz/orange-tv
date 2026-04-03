# Ubuntu VM local setup (validation target)

This document is the **placeholder and checklist** for running Orange TV on **Ubuntu** (VM or bare metal) so Linux assumptions are validated without blocking day-to-day **Windows** development.

For the full Windows path (clone → smoke test), see [`local-setup-windows.md`](local-setup-windows.md).

**End-of-sprint Linux gate (broader than install smoke):** [`linux-smoke-checklist.md`](linux-smoke-checklist.md) · **Cross-environment matrix:** [`testing-matrix-v1.md`](testing-matrix-v1.md).

## Purpose

- Match the **target appliance OS** (Ubuntu 24.04 LTS per project plan) early.
- Verify **paths**, **line endings** in configs, and **process launch** behavior before hardware bring-up.
- Keep **Windows** as the fastest inner loop; Ubuntu is a **scheduled validation** step (e.g. end of sprint).

## Workflow: develop on Windows, validate in the VM

| Role | Where |
| --- | --- |
| **Daily development** | Windows — editor, **`npm run dev`**, Git commits |
| **Linux validation** | Ubuntu VM — **native clone** of the repo, **`git pull`**, **`npm run setup`** when deps change, **`npm run dev`** in the VM |

1. On **Windows:** work as usual; push when you want the VM to pick up changes.
2. In the **VM:** open a terminal, `cd` to your clone (e.g. `~/src/orange-tv`), **`git pull`**, then **`npm run setup`** if `package-lock.json`, launcher deps, or the API project changed.
3. Run **`npm run dev`** **inside the VM** and use **`http://localhost:5173/`** and **`http://localhost:5144/`** in a browser or `curl` **in the guest**.

**Why not a VirtualBox shared folder as the repo?** A working tree on a Windows-mounted share often breaks **`node_modules`** (symlinks, permissions). Keep a **Linux filesystem clone** and sync with **Git**.

### Routine validation

```bash
cd ~/src/orange-tv
git pull
npm run setup   # when package-lock, launcher deps, or api project changed; skip if you are sure nothing changed
npm run dev
```

Then open **`http://localhost:5173/`** in a browser **inside the VM**.

## VM recommendation (baseline)

| Item | Suggestion |
| --- | --- |
| OS | **Ubuntu 24.04 LTS** (desktop or server + desktop packages if you need a GUI for Chrome/MPV tests) |
| Resources | **4 vCPU** is a solid default for sprint smoke (minimum **4+**); **8+ GB RAM**, **40+ GB** disk (tune to your host) |
| Network | Bridged or NAT with outbound access for `apt`, `npm`, and `dotnet` installs |

Exact ISO download and hypervisor steps are intentionally left to your team standard (VirtualBox, VMware, Hyper-V, etc.).

## Prerequisites (same stack as Windows)

Install on the Ubuntu guest:

- **Git**
- **Node.js LTS** and **npm** (use [NodeSource](https://github.com/nodesource/distributions) or your approved method)
- **.NET SDK** matching `api/*.csproj` (see [Download .NET](https://dotnet.microsoft.com/download))

Optional for future streaming/playback tests:

- Google Chrome (or Chromium), **MPV**, **ffmpeg/ffprobe** — not required for the current API + Vite smoke test.

## Clone and install

From a directory you own (e.g. `~/src`):

```bash
git clone <your-repo-url> orange-tv
cd orange-tv
npm run setup
```

## Run (development)

```bash
npm run dev
```

Expected:

- Vite: **`http://localhost:5173/`** (or the host shown in the terminal)
- API: **`http://localhost:5144/`** by default (see `api/Properties/launchSettings.json`)
- Chromium/Chrome app window opens automatically once the launcher URL is reachable

## Testing from inside the VM

| Topic | What to do |
| --- | --- |
| **Network mode** | **NAT** (VirtualBox default) is enough for `apt` / `npm` / `dotnet`. |
| **URLs** | **`http://localhost:5173/`** and **`http://localhost:5144/`** from Firefox/Chromium and `curl` **in the guest** after **`npm run dev`** there. |
| **Guest Additions** | Optional: better resolution and shared clipboard with the host. |

Clone the repo **inside** the guest home (e.g. `~/src/orange-tv`), not on a Windows shared folder, to avoid **`node_modules`** issues.

## Smoke test checklist (Ubuntu)

Mirror [`local-setup-windows.md`](local-setup-windows.md) with Linux equivalents:

- [ ] `npm run setup` completes without errors
- [ ] `npm run dev` starts both processes; no immediate crash
- [ ] Chromium/Chrome opens automatically and the Vite app renders
- [ ] `curl -s -o /dev/null -w "%{http_code}" http://localhost:5144/weatherforecast` prints **`200`**
- [ ] Optional: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5144/api/v1/system/platform` prints **`200`** (response should show `isLinux: true` on Ubuntu)

If `curl` is not installed: `sudo apt update && sudo apt install -y curl`.

## Linux-specific work (future)

The following belong here or under `scripts/linux/` as the product matures; they are **not** required for the scaffold:

- **Display stack:** Wayland + `labwc` session (see `docs/project-plan-v1.2.md`)
- **Packages:** `chromium-browser` or Chrome, `mpv`, `ffmpeg`
- **Appliance:** auto-login, kiosk, watchdog — tracked in the architecture plan, not in this repo skeleton yet

## Known gaps

| Gap | Note |
| --- | --- |
| No appliance image yet | This doc covers **developer VM** validation only |
| Path and shell differences | Use forward slashes in env examples where possible; see `docs/environment.md` |
| Parity with Windows | Behavior should match; file **line endings** are normalized by `.editorconfig` (LF) |

When this checklist is stable, consider promoting sections into `scripts/linux/` helpers referenced from `scripts/README.md`.
