import type { HomeScreenData } from "@/data/seedHome.ts";

/** Two nav items, hero, two rows with disabled tile in first row (for skip / column alignment). */
export function minimalHome(): HomeScreenData {
  return {
    nav: [
      { id: "nav-a", label: "A", shortLabel: "A" },
      { id: "nav-b", label: "B", shortLabel: "B" },
    ],
    hero: {
      title: "H",
      subtitle: "S",
      backgroundImageUrl: null,
    },
    rows: [
      {
        id: "row-0",
        title: "R0",
        tiles: [
          { id: "t0", title: "T0" },
          { id: "t1", title: "T1", disabled: true },
          { id: "t2", title: "T2" },
        ],
      },
      {
        id: "row-1",
        title: "R1",
        tiles: [{ id: "r1-t0", title: "X" }],
      },
    ],
  };
}

/** Sidebar + hero only; no content rows (hero cannot move into rows). */
export function homeNoRows(): HomeScreenData {
  return {
    nav: [{ id: "only", label: "Only", shortLabel: "O" }],
    hero: {
      title: "H",
      subtitle: "S",
      backgroundImageUrl: null,
    },
    rows: [],
  };
}
