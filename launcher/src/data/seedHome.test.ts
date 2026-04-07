import { SEED_HOME } from "@/data/seedHome.ts";
import { describe, expect, it } from "vitest";

describe("SEED_HOME", () => {
  it("has nav, hero, and at least one row with tiles", () => {
    expect(SEED_HOME.nav.length).toBeGreaterThan(0);
    expect(SEED_HOME.hero.title.length).toBeGreaterThan(0);
    expect(SEED_HOME.rows.length).toBeGreaterThan(0);
    expect(SEED_HOME.rows[0]?.tiles.length).toBeGreaterThan(0);
  });
});
