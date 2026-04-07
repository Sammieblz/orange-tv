import { vi } from "vitest";

/** Stubs `globalThis.fetch` for weather + platform endpoints used by the launcher. */
export function stubApiFetchSuccess() {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/weatherforecast")) {
      return Response.json([
        {
          date: "2025-01-01",
          temperatureC: 1,
          summary: "Bracing",
          temperatureF: 33,
        },
      ]);
    }
    if (url.includes("/api/v1/system/platform")) {
      return Response.json({
        osDescription: "Test OS",
        frameworkDescription: ".NET 9.0 test",
        isWindows: true,
        isLinux: false,
        preferredDirectorySeparator: "/",
        sampleNormalizedPath: "C:/Users/demo/file.txt",
      });
    }
    return new Response("Not found", { status: 404 });
  });
}
