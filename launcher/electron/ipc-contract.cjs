/**
 * Approved IPC channels for renderer -> main (via preload only).
 * Do not expose generic invoke; keep this list explicit.
 */
const CHANNELS = {
  PING: "orange-tv:ping",
  LAUNCH_REQUEST: "orange-tv:launch-request",
};

module.exports = { CHANNELS };
