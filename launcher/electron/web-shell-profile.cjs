/**
 * Per-tile persistent profile mapping for the in-shell BrowserView (SAM-57).
 *
 * The existing .NET `ProcessLaunchService` resolves Chrome `--user-data-dir` via
 * `api/Launch/ChromeProfilePaths.cs` (`ResolveSegmentFolderName`). When the streaming
 * tile moves off "spawn Chrome" and into an in-Electron BrowserView, we still want
 * sign-ins to persist per app and to **share** state with apps that opt into the
 * same `chromeProfileSegment`. Electron expresses "persistent session" as a
 * partition name on `session.fromPartition('persist:<segment>')`, not a file path,
 * so this helper produces a stable partition string that mirrors the C#
 * sanitization rules.
 *
 * See:
 * - `docs/chrome-profiles-and-backup.md` (segment model)
 * - `docs/player-and-streaming-strategy.md` → "Streaming shell"
 */

const MAX_SEGMENT_LENGTH = 128;

/**
 * Mirror of `ChromeProfilePaths.SanitizeSegment` for parity with the API; replaces
 * characters that would be invalid file-name parts with `_` because we want a
 * segment that works both as a folder name (Chrome) and as an Electron partition
 * name (BrowserView) — the intersection is "printable, no control or path chars".
 *
 * @param {string} value
 * @returns {string}
 */
function sanitizeSegment(value) {
  if (typeof value !== "string") return "app";
  // Control chars (0x00-0x1F), path separators, and common filesystem-invalid chars.
  const cleaned = value.replace(/[\x00-\x1f<>:"/\\|?*]/g, "_").trim();
  if (cleaned.length === 0) return "app";
  return cleaned.length > MAX_SEGMENT_LENGTH ? cleaned.slice(0, MAX_SEGMENT_LENGTH) : cleaned;
}

/**
 * @param {{ appId?: unknown, chromeProfileSegment?: unknown }} input
 * @returns {{ ok: false, reason: string } | { ok: true, segment: string, partition: string }}
 */
function resolveWebShellPartition(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, reason: "invalid-input" };
  }
  const { appId, chromeProfileSegment } = /** @type {{ appId?: unknown; chromeProfileSegment?: unknown }} */ (
    input
  );
  const segmentRaw =
    typeof chromeProfileSegment === "string" && chromeProfileSegment.trim().length > 0
      ? chromeProfileSegment
      : typeof appId === "string"
        ? appId
        : "";
  if (!segmentRaw || segmentRaw.trim().length === 0) {
    return { ok: false, reason: "missing-segment" };
  }
  const segment = sanitizeSegment(segmentRaw);
  return { ok: true, segment, partition: `persist:${segment}` };
}

module.exports = {
  MAX_SEGMENT_LENGTH,
  sanitizeSegment,
  resolveWebShellPartition,
};
