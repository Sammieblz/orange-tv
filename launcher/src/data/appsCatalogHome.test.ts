import { buildAppsCatalogHome } from "@/data/appsCatalogHome.ts";
import type { AppDto } from "@/api/types.ts";
import { describe, expect, it } from "vitest";

const baseApp = (partial: Partial<AppDto> & Pick<AppDto, "id" | "label">): AppDto => ({
  launchUrl: null,
  sortOrder: 0,
  createdAtUtc: "",
  updatedAtUtc: "",
  chromeProfileSegment: null,
  sessionFreshness: "Unknown",
  lastSessionEndedAtUtc: null,
  lastSessionExitCode: null,
  type: "chrome",
  ...partial,
});

describe("buildAppsCatalogHome", () => {
  it("maps every app to an app: tile when successful", () => {
    const home = buildAppsCatalogHome(
      [
        baseApp({ id: "a", label: "A", sortOrder: 1 }),
        baseApp({ id: "b", label: "B", sortOrder: 0 }),
      ],
      "success",
    );
    const tiles = home.rows.find((r) => r.id === "apps-catalog")?.tiles;
    expect(tiles?.map((t) => t.id)).toEqual(["app:b", "app:a"]);
  });

  it("shows loading placeholder while pending", () => {
    const home = buildAppsCatalogHome(undefined, "pending");
    expect(home.rows[0]?.tiles[0]?.title).toMatch(/Loading/);
  });
});
