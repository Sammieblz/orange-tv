/** Vite-exposed API origin; see `.env.example`. */
export function getApiBaseUrl(): string {
  const v = import.meta.env.VITE_ORANGETV_API_BASE_URL;
  if (typeof v === "string" && v.trim().length > 0) {
    return v.replace(/\/$/, "");
  }
  return "http://localhost:5144";
}

export async function fetchJson<T>(path: string): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed ${res.status}`);
  }
  return res.json() as Promise<T>;
}
