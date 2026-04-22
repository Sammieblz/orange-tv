# Contributing to Orange TV

**Product version:** `1.0.0` in [`package.json`](package.json) and [`launcher/package.json`](launcher/package.json).

## Branches

- **`main`** — integration branch; keep it buildable. Direct pushes are discouraged; use pull requests.
- **Feature branches** — create from `main` using a predictable name:
  - `feature/<short-topic>` (e.g. `feature/launcher-focus-grid`)
  - or `<username>/<issue>-<short-topic>` if you track work items (e.g. `sam/42-api-health-endpoint`)

Release/hotfix naming is optional until you ship versions; add `release/x.y` or `hotfix/...` when needed.

## Pull requests

- One logical change per PR when possible.
- Describe **what** changed and **why** (not only the diff).
- Reference related issues or tickets in the description.
- Ensure **Windows smoke test** steps in `docs/local-setup-windows.md` still pass for changes that touch the dev workflow or build.

## Commit messages

Prefer messages that read well in `git log` and (optionally) work with automated tooling.

**Recommended: [Conventional Commits](https://www.conventionalcommits.org/)** — optional but consistent:

| Prefix | Use for |
| --- | --- |
| `feat:` | New user-visible behavior |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Maintenance, deps, tooling |
| `refactor:` | Code change without behavior change |
| `test:` | Tests only |

Examples:

```text
feat(api): add platform environment endpoint
fix(launcher): correct Vite base path for dev
docs: expand Ubuntu VM setup stub
```

**Subject line:** imperative mood, ~50 characters, no trailing period.

**Body:** optional; use for context, breaking changes, or follow-ups.

## .NET EF migrations

- Restore the local tool manifest once per clone: **`dotnet tool restore`** (also runs from **`npm run setup`** at the repo root).
- Add a migration after model changes (from the repo root):

  ```bash
  dotnet tool run dotnet-ef migrations add <Name> --project api/OrangeTv.Api.csproj --output-dir Data/Migrations
  ```

- The API applies migrations on startup (`Database.Migrate()`).

## Tests

Root [`package.json`](package.json) scripts:

| Script | What it runs |
| --- | --- |
| **`npm test`** | **`dotnet test`** only (API + integration tests). Fastest backend-only check. |
| **`npm run test:all`** | Launcher **Vitest** → Electron **`node:test`** suite (`ipc-contract`, `preload-bridge`, `shell-profile`, `window-lifecycle`, `window-fullscreen-kiosk-guard`, etc.) → **`dotnet test orange-tv.sln`**. Use before pushing when UI or Electron main changed. |
| **`npm run verify`** | Launcher **ESLint** then the same sequence as **`test:all`**. Full local gate. |

Individual stacks:

- **API (xUnit):** `dotnet test` or `dotnet test orange-tv.sln` from the repo root.
- **Launcher (Vitest):** `npm --prefix launcher test`.
- **Electron main (Node test):** `npm --prefix launcher run test:electron` — IPC contracts, preload bridge, shell-profile, window lifecycle, **kiosk fullscreen guard** (`launcher/electron/window-fullscreen-kiosk-guard.cjs`).

**`launcher/electron/main.cjs`** is not imported as a whole in unit tests (no headless Electron harness). Kiosk fullscreen **reject-when-leaving-fullscreen** logic lives in the pure module above; integration with `BrowserWindow` is covered by manual/smoke runs (`docs/local-setup-windows.md`, `docs/linux-smoke-checklist.md`). **`WindowsChildProcessWindowOrchestrator`** relies on Win32; API integration tests cover **404/501**; full HWND behavior is validated on Windows manually.

## CI (future)

When adding GitHub Actions (or similar), a practical matrix is:

- **ubuntu-latest:** `npm run verify` or `npm run test:all` (Vitest + Electron node tests + `dotnet test` — Win32 code still **compiles** on Linux for the API project).
- **windows-latest:** Same, to exercise Windows-specific paths if you add conditional tests later.

No workflow is committed yet; keep **`npm run verify`** green locally as the bar.

## Code style

- **C# / .NET:** follow `.editorconfig` at repo root; run `dotnet format` when touching `api/`.
- **TypeScript / launcher:** ESLint + Prettier in `launcher/` (`npm --prefix launcher run lint`).

## Environment and secrets

- Do not commit `.env` files or secrets. Use `.env.example` and `docs/environment.md`.
