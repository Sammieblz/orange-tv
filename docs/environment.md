# Environment conventions

This repo uses simple, explicit environment-variable conventions so local dev is reproducible on Windows and Linux.

## Files and naming

- **Do not commit** `.env` files.
- Commit only **example templates** like `.env.example`.

Recommended workflow:

1. Copy `.env.example` to `.env` (optional; only if you need overrides).
2. Override values locally without changing tracked files.

## Frontend (Vite) conventions

Vite only exposes variables to the browser when they are prefixed with `VITE_`.

- **Prefix**: `VITE_ORANGETV_...`
- **Example**:
  - `VITE_ORANGETV_API_BASE_URL=http://localhost:5144`

## Backend (.NET) conventions

ASP.NET Core supports hierarchical configuration via environment variables using **double underscores** (`__`) to represent nesting.

- **Prefix**: `ORANGETV_API__...`
- **Pattern**: `ORANGETV_API__Section__Key=value`

Examples:

- `ORANGETV_API__Data__SqlitePath=C:/path/to/orange-tv.db`
- `ORANGETV_API__Features__EnableDiagnostics=true`

## Paths (Windows + Linux)

When documenting paths:

- Prefer **forward slashes** in docs and examples (`C:/Users/...`) since they also work well with many cross-platform tools.
- For Linux appliance targets, keep persistent data in a documented app directory (e.g. `/var/lib/orange-tv/`).

## Source of truth

- See `.env.example` for current variable examples.
- For backend defaults, `.NET` launch settings may also define ports/URLs during development.

