# Contributing to Orange TV

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

- **API (xUnit):** `dotnet test` from the repo root (or `dotnet test orange-tv.sln`). Covers `OrangeTv.Api` plus shell/path helpers and HTTP integration tests.
- **Launcher (Vitest):** `npm --prefix launcher test`.
- **Electron main (Node test):** `npm --prefix launcher run test:electron` (shell-profile env matrix).
- **Both:** `npm run test:all` runs launcher tests then `dotnet test`.

## Code style

- **C# / .NET:** follow `.editorconfig` at repo root; run `dotnet format` when touching `api/`.
- **TypeScript / launcher:** ESLint + Prettier in `launcher/` (`npm --prefix launcher run lint`).

## Environment and secrets

- Do not commit `.env` files or secrets. Use `.env.example` and `docs/environment.md`.
