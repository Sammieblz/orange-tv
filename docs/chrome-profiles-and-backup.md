# Chrome profiles and backup

Orange TV keeps streaming sign-in state the same way Chrome does on a normal desktop: each launch uses **`--user-data-dir`** pointing at a directory on disk. The service does **not** read cookies, passwords, or other browser credentials; persistence is entirely those folders.

## Where profiles live

Resolution order for the **parent** directory (under which each profile segment folder is created):

1. Settings key **`launcher.chrome.profilesRoot`** (optional), if set in `GET/PUT /api/v1/settings`.
2. Config **`ORANGETV_API__Launch__ChromeProfilesRoot`** when the setting is empty.
3. Default: **`{OrangeTvDataRoot}/launch-chrome`** where `OrangeTvDataRoot` is the same base used elsewhere (see [`BrowserShellPaths`](../api/Shell/BrowserShellPaths.cs) — typically `%LOCALAPPDATA%/OrangeTv` on Windows, XDG-style paths on Linux).

Each app row uses a **segment** folder under that parent:

- If **`ChromeProfileSegment`** is null, the folder name is a sanitized form of **`apps.id`** (stable per app).
- If **`ChromeProfileSegment`** is set to the **same value** on multiple apps, those apps **share** one profile directory (one sign-in surface).

The API logs the resolved path at launch: `Chrome user-data-dir for {AppId}: ...`.

## Do not confuse with the database

| What | Typical location |
|------|------------------|
| **SQLite** control plane (`apps`, `settings`, `launch_sessions`) | Configured by `ORANGETV_API__Data__SqlitePath`; default under `%LOCALAPPDATA%/OrangeTv/orange-tv.db` (Windows). |
| **Chrome profile data** (cookies, local storage, etc.) | Under the resolved **profiles parent** + segment, **not** inside the `.db` file. |

Deleting or resetting the **database** does not remove Chrome profile folders. Deleting **profile folders** does not remove the DB. Operators should know which artifact they are wiping.

## Backup and restore

**Backup:** With Chrome/Chromium **closed**, copy the entire resolved **profiles parent** directory, or individual segment subfolders you care about.

**Restore:** Place folders back at the same paths **before** launching the streaming shortcut again.

**Avoid:**

- Deleting or moving profile directories while the browser process is still running.
- Pointing **`launcher.chrome.profilesRoot`** at a path you share with unrelated tools without understanding that the whole tree is user-data for Chromium.

## Session hints on tiles

The launcher shows short lines like “May need sign-in” based on **`SessionFreshness`** on each app row (updated when child processes exit and via **`PUT /api/v1/apps/{id}/session-freshness`**). These are **heuristic** UX hints, not proof of login state.

## Ubuntu VM validation checklist

Use this on a Linux VM before appliance hardware is available:

1. Install Chromium or Google Chrome (`chromium`, `google-chrome-stable`, or equivalent).
2. Set a writable profile root, e.g. `ORANGETV_API__Launch__ChromeProfilesRoot=/home/<user>/.local/share/OrangeTv/launch-chrome` (or use **`launcher.chrome.profilesRoot`** via the settings API).
3. Start the API and launcher; open the seeded streaming tile twice.
4. Confirm in API logs that **`Chrome user-data-dir`** is the **same path** on both launches.
5. Manually verify in the browser that session feels persistent (e.g. stays on the same site profile); do **not** export or parse credential stores.
