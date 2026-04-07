/**
 * POST /api/v1/launch on the local .NET service (Node fetch; no Electron import).
 */

/**
 * @returns {string}
 */
function resolveApiBaseUrl() {
  const raw = process.env.ORANGETV_ELECTRON__API_BASE_URL || "";
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed.length > 0) {
    return trimmed.replace(/\/$/, "");
  }
  return "http://localhost:5144";
}

/**
 * @param {string} appId
 * @returns {Promise<{ ok: boolean; reason?: string; sessionId?: string; pid?: number }>}
 */
async function postLaunch(appId) {
  const base = resolveApiBaseUrl();
  const url = `${base}/api/v1/launch`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appId }),
      signal: controller.signal,
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    if (!res.ok) {
      const reason =
        typeof data.reason === "string" ? data.reason : `http-${res.status}`;
      return { ok: false, reason };
    }
    if (data.ok === false) {
      return { ok: false, reason: typeof data.reason === "string" ? data.reason : "launch-failed" };
    }
    return {
      ok: true,
      sessionId: typeof data.sessionId === "string" ? data.sessionId : undefined,
      pid: typeof data.pid === "number" ? data.pid : undefined,
    };
  } catch (e) {
    return { ok: false, reason: "network-error" };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  resolveApiBaseUrl,
  postLaunch,
};
