# Scripts

Platform-specific and cross-cutting automation lives here so the **Windows dev loop** stays simple while **Linux/Ubuntu** steps stay explicit and reviewable.

## Layout

| Path | Role |
| --- | --- |
| `windows/` | Optional helpers for Windows dev machines (`.ps1` / `.cmd`). Add as needed. |
| `linux/` | Optional helpers for Ubuntu VM / appliance (`.sh`). Add as needed. |

The repository root **`package.json`** remains the **canonical** way to run `npm run dev` on any OS where Node and .NET are installed.

| Path | Role |
| --- | --- |
| `generate-design-system.mjs` | Optional: runs ui-ux-pro-max `search.py --design-system --persist` when `.cursor/skills/ui-ux-pro-max` exists; flattens output into `docs/design-system/MASTER.md`. Invoked via **`npm run design-system`**. |

## Principles

- **Do not** fork business logic into shell scripts when it belongs in `api/` (e.g. launch orchestration). Scripts should bootstrap environments or call documented commands.
- **OS-aware behavior** in the product should go through **.NET services** (see `api/Platform/`) so Windows and Linux share one code path for decisions; scripts only wrap installs or system commands that differ by OS.
- Prefer **forward slashes** in documented paths where tools allow it.

## Future examples (not shipped yet)

- `linux/install-dev-deps.sh` — `apt` packages for Chromium, MPV, ffmpeg
- `windows/dev-cert.ps1` — optional HTTPS dev cert trust on Windows
