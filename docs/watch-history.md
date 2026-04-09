# Watch history and Continue Watching

## Persistence

- **`watch_events`**: append-only rows for launch and playback-related events (`AppLaunched`, `PlaybackStarted`, `PlaybackProgress`, `PlaybackEnded`).
- **`media_resume`**: one row per indexed `media_items` row, updated from events (not triggers). Used for fast Continue Watching and resume metadata.
- **`launch_sessions.MediaItemId`**: optional link when MPV plays a file that matches the library index.

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/watch/events` | Ingest a client-reported event (e.g. future MPV IPC progress). |
| GET | `/api/v1/watch/continue?take=` | Partially watched items; ordered by `LastPlayedAtUtc DESC`, then `MediaItemId ASC` (deterministic). |
| GET | `/api/v1/watch/history?skip=&take=` | Recent events (newest first). |
| POST | `/api/v1/launch/media/{mediaItemId}` | Launch MPV for a library item (uses seeded app id `local-media`). |

## Phase 1 vs phase 2 progress

- **Phase 1 (current)**: When a library MPV session ends, if the media row has `DurationSeconds`, the API records **coarse** progress using session wall-clock vs that duration (not true seek position). Good enough for Continue Watching ordering and rough bar state.
- **Phase 2**: Launch MPV with IPC (`--input-ipc-server`) and `POST` `PlaybackProgress` events for accurate resume and scrub position.

## Launcher

- Continue row tiles use ids `media:{guid}` and invoke `launchRequest({ kind: "media", mediaItemId })`, which maps to `POST /api/v1/launch/media/{id}` in the Electron main process.
