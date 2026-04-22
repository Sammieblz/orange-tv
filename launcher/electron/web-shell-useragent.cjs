/**
 * User-agent normalization for the in-window streaming BrowserView (SAM-61).
 *
 * Sites treat `Electron/x.y.z` as a non-consumer runtime and sometimes throw a
 * "download our app" modal or block features. Stripping it leaves a plain Chrome
 * UA that matches what a normal Chromium browser would send.
 *
 * Kept as a pure function (no Electron import) so we can unit-test it.
 */

/**
 * @param {string} ua
 * @returns {string}
 */
function stripElectronFromUserAgent(ua) {
  if (typeof ua !== "string" || ua.length === 0) return ua;
  // Remove any " Electron/<version>" token while preserving surrounding whitespace.
  const cleaned = ua.replace(/\s*Electron\/[^\s]+/gi, "");
  // Collapse double spaces that might remain.
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

module.exports = { stripElectronFromUserAgent };
