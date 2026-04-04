# Ubuntu local setup (target OS)

**Ubuntu 24.04 LTS** is the **appliance and validation OS** in the project plan. Use this guide when you run Orange TV **on Ubuntu itself** — bare metal, VM, or mini PC — not only as a “someday” check from Windows.

- **Windows-focused setup** (PowerShell, Windows paths): [`local-setup-windows.md`](local-setup-windows.md)
- **Sprint Linux gate:** [`linux-smoke-checklist.md`](linux-smoke-checklist.md) · **Cross-environment matrix:** [`testing-matrix-v1.md`](testing-matrix-v1.md)

## Who this is for

| Situation | What to do |
| --- | --- |
| **Daily development on Ubuntu** | Follow **Clone and install** and **Run (development)** below; same `package.json` commands as Windows. |
| **Develop on Windows, validate on Ubuntu** | Keep a **native Linux clone** (not a Windows shared folder), `git pull`, `npm run setup` when deps change, then **`npm run dev`** in the guest. |
| **Headless server / SSH only** | **BrowserShell** and **Electron** need a **display**. Use **`ORANGETV_API__BrowserShell__Enabled=false`**, run **`npm run dev:api`** + **`npm --prefix launcher run dev`**, and open **`http://<host>:5173`** from a machine that has a browser, or use **`curl`** against **`5144`**. Adjust firewall and Vite **`server.host`** if you bind beyond loopback (advanced). |

## Prerequisites (Ubuntu)

Install on the machine or VM:

| Tool | Purpose |
| --- | --- |
| **Git** | Clone |
| **Node.js LTS** + **npm** | [NodeSource](https://github.com/nodesource/distributions) or your approved install |
| **.NET SDK** | Match `api/*.csproj` — [Download .NET](https://dotnet.microsoft.com/download) |
| **A graphical session** | **BrowserShell** (Chromium/Chrome app window) and **Electron** need Wayland or X11 with a logged-in desktop (or a remote desktop that provides `DISPLAY`). |

**Browser for dev `npm run dev`:** In Development, the API’s **BrowserShell** tries, in order: **`chromium-browser`**, **`chromium`**, **`google-chrome`**, **`google-chrome-stable`** (see `api/Shell/ChromiumShellHostedService.cs`). Install at least one:

```bash
sudo apt update
# Typical Ubuntu: Chromium (package name may be chromium-browser as a transitional name, or chromium)
sudo apt install -y chromium-browser || sudo apt install -y chromium
```

If auto-launch logs **“Unable to auto-launch Chromium shell”**, set an explicit binary in `.env`:

```bash
# Example — use the path from: command -v chromium || command -v google-chrome-stable
ORANGETV_API__BrowserShell__ExecutablePath=/usr/bin/chromium
```

**Snap note:** Snap-packaged Chromium can behave differently (sandbox, paths). If launch fails, prefer a **deb** Chromium/Chrome or set **`ExecutablePath`** to the binary you verified in a terminal.

**Optional (future playback / parity with plan):** **MPV**, **ffmpeg/ffprobe** — not required for the current API + Vite smoke test.

## Clone and install

Use a directory on a **Linux native filesystem** (e.g. `~/src`), not a VirtualBox shared folder from Windows (avoids **`node_modules`** symlink and permission issues).

```bash
git clone <your-repo-url> orange-tv
cd orange-tv
npm run setup
```

## Run (development)

From the **repository root**:

```bash
npm run dev
```

This starts:

- **Vite** on **`127.0.0.1:5173`** (`launcher/vite.config.ts`). Open **`http://localhost:5173/`** or **`http://127.0.0.1:5173/`** in a browser on the same machine.
- **API** on **`http://localhost:5144/`** by default (`api/Properties/launchSettings.json`).
- **BrowserShell**: opens Chromium/Chrome in app mode when the launcher URL is ready (unless **`ORANGETV_API__BrowserShell__Enabled=false`** in `.env`).

Stop with **Ctrl+C**.

### API and launcher separately (optional)

Same as Windows: **`npm run dev:api`** in one terminal, **`npm --prefix launcher run dev`** in another.

### Electron (optional)

1. Set **`ORANGETV_API__BrowserShell__Enabled=false`** if you do not want the API-driven Chromium window.
2. **`npm run dev:api`** (or full **`npm run dev`** if you accept two shells).
3. **`npm run dev:electron`** from the repo root.

You should see **`[vite]`** and **`[electron]`** in the log. **Electron on Linux** needs the same graphical session as BrowserShell.

**Production-style load (built assets):**

```bash
npm --prefix launcher run build
cd launcher && npm run electron:prod
```

**Fullscreen / appliance-style shell** (e.g. mini PC or VM with display):

```bash
export ORANGETV_ELECTRON__SHELL_PROFILE=appliance
# Optional: ORANGETV_ELECTRON__KIOSK=1
npm run dev:electron
```

Details: [`environment.md`](environment.md), [`electron-shell.md`](electron-shell.md).

## Environment and data paths (Ubuntu)

- Copy **`.env.example`** to **`.env`** for overrides; see [`environment.md`](environment.md).
- **SQLite** example for Linux is already in `.env.example` (`/var/lib/orange-tv/...`); create the directory and permissions to match how you run the API.
- **BrowserShell profile and launch state** default under the .NET user data root (typically **`~/.local/share/OrangeTv/`** on Linux when `SpecialFolder.LocalApplicationData` maps to XDG). Useful if you need to clear a stuck shell state.

## Testing from the Ubuntu machine

| Check | Command or action |
| --- | --- |
| API | `curl -s -o /dev/null -w "%{http_code}" http://localhost:5144/weatherforecast` → **200** |
| Platform | `curl -s -o /dev/null -w "%{http_code}" http://localhost:5144/api/v1/system/platform` → **200** (expect **`isLinux":true`** on Ubuntu) |
| Launcher | Open **`http://localhost:5173/`** in Firefox/Chromium after **`npm run dev`** |

Install **`curl`** if needed: `sudo apt install -y curl`.

## VM-specific notes

| Topic | Suggestion |
| --- | --- |
| **Resources** | **4 vCPU**, **8+ GB RAM**, **40+ GB** disk (tune to host) |
| **Network** | NAT is enough for `apt` / `npm` / `dotnet` |
| **Guest Additions** | Optional: resolution, shared clipboard |
| **Repo location** | Clone **inside** the guest home, not on a Windows-mounted share |

## Smoke test checklist (Ubuntu)

- [ ] `npm run setup` completes without errors
- [ ] `npm run dev` starts Vite and API; no immediate crash
- [ ] Chromium/Chrome opens **or** you disabled BrowserShell and opened the URL manually
- [ ] `curl` checks above return **200**
- [ ] Optional: **`npm run dev:electron`** works with BrowserShell disabled

## Troubleshooting (Ubuntu)

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Log: **Unable to auto-launch Chromium shell** | No browser on PATH or Snap/path quirks | Install **chromium** or **Chrome**; set **`ORANGETV_API__BrowserShell__ExecutablePath`** |
| **Electron** never appears | **`wait-on`** stuck (use current `launcher/`), or no display | Use current repo; ensure a desktop session; see [`local-setup-windows.md`](local-setup-windows.md) troubleshooting for **`[electron]`** |
| **Only** API Chromium window when you wanted Electron | BrowserShell still enabled | **`ORANGETV_API__BrowserShell__Enabled=false`** |
| **EACCES** / sqlite path errors | Data dir missing or wrong user | Fix **`ORANGETV_API__Data__SqlitePath`** and directory permissions |

## Known gaps

| Gap | Note |
| --- | --- |
| **No appliance image yet** | This doc is **developer** Ubuntu; kiosk auto-login, **labwc**, watchdog — see `docs/project-plan-v1.2.md` |
| **Parity with Windows** | Same commands; paths and browser packages differ — use **`.env`** and [`environment.md`](environment.md) |

When this checklist is stable, consider promoting sections into `scripts/linux/` helpers referenced from [`scripts/README.md`](scripts/README.md).
