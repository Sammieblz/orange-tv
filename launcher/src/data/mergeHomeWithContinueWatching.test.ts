import { mergeHomeWithContinueWatching } from "@/data/mergeHomeWithContinueWatching.ts";
import { SEED_HOME } from "@/data/seedHome.ts";
import { describe, expect, it } from "vitest";

describe("mergeHomeWithContinueWatching", () => {
  it("leaves home unchanged when items undefined (loading)", () => {
    expect(mergeHomeWithContinueWatching(SEED_HOME, undefined)).toEqual(SEED_HOME);
  });

  it("replaces continue row tiles when items is empty", () => {
    const merged = mergeHomeWithContinueWatching(SEED_HOME, []);
    const row = merged.rows.find((r) => r.id === "continue");
    expect(row?.tiles).toEqual([]);
    expect(merged.rows.find((r) => r.id === "launch-demos")?.tiles.length).toBe(
      SEED_HOME.rows.find((r) => r.id === "launch-demos")!.tiles.length,
    );
  });

  it("maps API items to media tile ids and progress", () => {
    const merged = mergeHomeWithContinueWatching(SEED_HOME, [
      {
        mediaItemId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test clip",
        thumbnailRelativePath: null,
        progress: 0.42,
        lastPlayedAtUtc: "2026-01-01T00:00:00Z",
      },
    ]);
    const row = merged.rows.find((r) => r.id === "continue");
    expect(row?.tiles).toHaveLength(1);
    expect(row?.tiles[0]).toMatchObject({
      id: "media:550e8400-e29b-41d4-a716-446655440000",
      title: "Test clip",
      progress: 0.42,
    });
  });
});
