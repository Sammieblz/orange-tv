# Local media library scanning

The API can index media files under configurable **scan roots**, extract metadata with **ffprobe** and **TagLibSharp**, and write thumbnails with **ffmpeg**. Scanning runs in a background service when enabled.

## Enable and configure

Set **`ORANGETV_API__Library__Enabled=true`** (see [`.env.example`](../.env.example)).

**Scan roots** (in order):

1. Settings value **`library.scanRoots`**: JSON array of absolute paths, e.g. `["C:/Videos","D:/Media"]` via `PUT /api/v1/settings/library.scanRoots`.
2. If unset or invalid: **`ORANGETV_API__Library__ScanRoots`** from configuration / `appsettings.json` (array of strings).

**File extensions** default to common video and audio types; override with **`ORANGETV_API__Library__FileExtensions`** (see ASP.NET Core array binding).

**Debounce**: filesystem events are coalesced (**`ORANGETV_API__Library__DebounceMilliseconds`**, default 3000 ms) before a full rescan.

## Tools

- **ffprobe** and **ffmpeg** must be on **`PATH`** or discoverable (see [`FfToolCandidates`](../api/Library/FfToolCandidates.cs)). If missing, metadata falls back to TagLib where possible and thumbnails are skipped.
- Logs use **`LibraryScannerService`** and **`LibraryScannerHostedService`** categories — filter these for scan errors vs HTTP.

## Cache layout

Thumbnails are stored under **`{OrangeTvDataRoot}/media-cache/thumbnails/{item-id}.jpg`**. The API persists a **relative** path on each row (`thumbnails/{id}.jpg`) for launcher/Electron to resolve later.

## API

- **`GET /api/v1/media/items?skip=&take=`** — paginated catalog (`total`, `skip`, `take`, `items`).
- **`POST /api/v1/media/library/scan`** — accepts a full rescan asynchronously (`202 Accepted`).

## Behavior

- **Upsert** by normalized absolute **file path** (unique).
- **Skip** re-extracting metadata when **size** and **last-write UTC** match the last scan (still updates `LastScannedAtUtc` on skip).
- **Remove** DB rows when the file no longer exists on disk (paths that were not part of the latest discovery set and `File.Exists` is false).
- Per-file failures set **`LastScanError`** on the row and log a **warning**; the process continues.

## Testing environment

The **`LibraryScannerHostedService`** does not run in the **`Testing`** ASP.NET environment (integration tests). The **`LibraryScannerService`** still respects **`Library:Enabled`**; keep it **`false`** in test host configuration unless testing scans explicitly.
