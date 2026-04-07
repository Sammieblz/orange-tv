import type { HomeScreenData } from "@/data/seedHome.ts";
import type { FocusSnapshot } from "@/store/focusStore.ts";
import { homeNoRows, minimalHome } from "@/test/fixtures/homeScreen.ts";
import { applyFocusKey, parseFocusKey } from "@/navigation/focusNavigation.ts";
import { describe, expect, it } from "vitest";

function snap(
  partial: Partial<FocusSnapshot> & Pick<FocusSnapshot, "section">,
): FocusSnapshot {
  return {
    sidebarIndex: 0,
    rowIndex: 0,
    colIndex: 0,
    ...partial,
  };
}

describe("parseFocusKey", () => {
  it("maps known keys", () => {
    expect(parseFocusKey("ArrowUp")).toBe("ArrowUp");
    expect(parseFocusKey("ArrowDown")).toBe("ArrowDown");
    expect(parseFocusKey("ArrowLeft")).toBe("ArrowLeft");
    expect(parseFocusKey("ArrowRight")).toBe("ArrowRight");
    expect(parseFocusKey("Enter")).toBe("Enter");
    expect(parseFocusKey("Escape")).toBe("Escape");
  });

  it("returns null for unknown keys", () => {
    expect(parseFocusKey("a")).toBeNull();
    expect(parseFocusKey("Space")).toBeNull();
    expect(parseFocusKey("")).toBeNull();
  });
});

describe("applyFocusKey", () => {
  const home = minimalHome();

  describe("sidebar", () => {
    it("ArrowUp clamps at 0", () => {
      const prev = snap({ section: "sidebar", sidebarIndex: 0 });
      const { next } = applyFocusKey(prev, "ArrowUp", home);
      expect(next.sidebarIndex).toBe(0);
    });

    it("ArrowDown moves within nav", () => {
      const prev = snap({ section: "sidebar", sidebarIndex: 0 });
      const { next } = applyFocusKey(prev, "ArrowDown", home);
      expect(next.sidebarIndex).toBe(1);
    });

    it("ArrowDown clamps at last nav", () => {
      const prev = snap({ section: "sidebar", sidebarIndex: 1 });
      const { next } = applyFocusKey(prev, "ArrowDown", home);
      expect(next.sidebarIndex).toBe(1);
    });

    it("ArrowRight goes to hero and first enabled tile column in row 0", () => {
      const prev = snap({ section: "sidebar", sidebarIndex: 0 });
      const { next } = applyFocusKey(prev, "ArrowRight", home);
      expect(next).toEqual(
        snap({
          section: "hero",
          rowIndex: 0,
          colIndex: 0,
          sidebarIndex: 0,
        }),
      );
    });

    it("ArrowLeft is no-op in sidebar", () => {
      const prev = snap({ section: "sidebar", sidebarIndex: 1 });
      const { next } = applyFocusKey(prev, "ArrowLeft", home);
      expect(next).toEqual(prev);
    });
  });

  describe("hero", () => {
    it("ArrowLeft returns to sidebar", () => {
      const prev = snap({ section: "hero", rowIndex: 0, colIndex: 0 });
      const { next } = applyFocusKey(prev, "ArrowLeft", home);
      expect(next.section).toBe("sidebar");
    });

    it("ArrowDown moves to first row first enabled col", () => {
      const prev = snap({ section: "hero", rowIndex: 0, colIndex: 0 });
      const { next } = applyFocusKey(prev, "ArrowDown", home);
      expect(next).toEqual(
        snap({
          section: "row",
          rowIndex: 0,
          colIndex: 0,
        }),
      );
    });

    it("stays on hero when no rows", () => {
      const empty: HomeScreenData = homeNoRows();
      const prev = snap({ section: "hero", rowIndex: 0, colIndex: 0 });
      const { next } = applyFocusKey(prev, "ArrowDown", empty);
      expect(next).toEqual(prev);
    });
  });

  describe("row", () => {
    it("ArrowRight skips disabled tile", () => {
      const prev = snap({
        section: "row",
        rowIndex: 0,
        colIndex: 0,
      });
      const { next } = applyFocusKey(prev, "ArrowRight", home);
      expect(next.section).toBe("row");
      expect(next.rowIndex).toBe(0);
      expect(next.colIndex).toBe(2);
    });

    it("ArrowLeft from first enabled goes to sidebar", () => {
      const prev = snap({
        section: "row",
        rowIndex: 0,
        colIndex: 0,
      });
      const { next } = applyFocusKey(prev, "ArrowLeft", home);
      expect(next.section).toBe("sidebar");
    });

    it("ArrowUp from row 0 goes to hero", () => {
      const prev = snap({
        section: "row",
        rowIndex: 0,
        colIndex: 2,
      });
      const { next } = applyFocusKey(prev, "ArrowUp", home);
      expect(next.section).toBe("hero");
    });

    it("ArrowDown clamps at last row", () => {
      const prev = snap({
        section: "row",
        rowIndex: 1,
        colIndex: 0,
      });
      const { next } = applyFocusKey(prev, "ArrowDown", home);
      expect(next).toEqual(prev);
    });

    it("aligns column when moving down with shorter row", () => {
      const prev = snap({
        section: "row",
        rowIndex: 0,
        colIndex: 2,
      });
      const { next } = applyFocusKey(prev, "ArrowDown", home);
      expect(next.rowIndex).toBe(1);
      expect(next.colIndex).toBe(0);
    });
  });

  describe("Enter", () => {
    it("activates sidebar item by id", () => {
      const prev = snap({ section: "sidebar", sidebarIndex: 0 });
      const { next, activate } = applyFocusKey(prev, "Enter", home);
      expect(next).toEqual(prev);
      expect(activate).toEqual({ context: "sidebar", id: "nav-a" });
    });

    it("activates hero-primary", () => {
      const prev = snap({ section: "hero", rowIndex: 0, colIndex: 0 });
      const { activate } = applyFocusKey(prev, "Enter", home);
      expect(activate).toEqual({ context: "hero", id: "hero-primary" });
    });

    it("activates enabled tile", () => {
      const prev = snap({
        section: "row",
        rowIndex: 0,
        colIndex: 0,
      });
      const { activate } = applyFocusKey(prev, "Enter", home);
      expect(activate).toEqual({ context: "tile", id: "t0" });
    });

    it("does not activate disabled tile", () => {
      const prev = snap({
        section: "row",
        rowIndex: 0,
        colIndex: 1,
      });
      const { activate } = applyFocusKey(prev, "Enter", home);
      expect(activate).toBeUndefined();
    });
  });

  describe("Escape", () => {
    it("from hero goes to sidebar", () => {
      const prev = snap({ section: "hero", rowIndex: 0, colIndex: 0 });
      const { next } = applyFocusKey(prev, "Escape", home);
      expect(next.section).toBe("sidebar");
    });

    it("from row goes to sidebar", () => {
      const prev = snap({
        section: "row",
        rowIndex: 0,
        colIndex: 0,
      });
      const { next } = applyFocusKey(prev, "Escape", home);
      expect(next.section).toBe("sidebar");
    });

    it("from sidebar is unchanged", () => {
      const prev = snap({ section: "sidebar", sidebarIndex: 1 });
      const { next } = applyFocusKey(prev, "Escape", home);
      expect(next).toEqual(prev);
    });
  });
});
