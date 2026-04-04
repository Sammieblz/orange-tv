import type { HomeScreenData } from "@/data/seedHome.ts";
import type { FocusSnapshot } from "@/store/focusStore.ts";

/**
 * Deterministic TV focus transitions. All movement is derived from this snapshot + home data
 * (no DOM measurement). See docs/focus-navigation.md for edge cases.
 */
export type FocusKey =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Enter"
  | "Escape";

export interface FocusActionResult {
  next: FocusSnapshot;
  /** Fired for Enter on an actionable target (sidebar / hero / enabled tile). */
  activate?: { context: "sidebar" | "hero" | "tile"; id: string };
}

function firstEnabledCol(tiles: { disabled?: boolean }[], preferred: number): number {
  if (tiles.length === 0) return 0;
  const start = Math.min(Math.max(0, preferred), tiles.length - 1);
  if (!tiles[start]?.disabled) return start;
  for (let i = 0; i < tiles.length; i++) {
    if (!tiles[i]?.disabled) return i;
  }
  return 0;
}

function lastEnabledCol(tiles: { disabled?: boolean }[]): number {
  for (let i = tiles.length - 1; i >= 0; i--) {
    if (!tiles[i]?.disabled) return i;
  }
  return 0;
}

function nextEnabledCol(tiles: { disabled?: boolean }[], from: number, dir: 1 | -1): number {
  let c = from + dir;
  while (c >= 0 && c < tiles.length) {
    if (!tiles[c]?.disabled) return c;
    c += dir;
  }
  return -1;
}

function rowTiles(home: HomeScreenData, rowIndex: number) {
  return home.rows[rowIndex]?.tiles ?? [];
}

function clampSidebarIndex(index: number, navCount: number): number {
  if (navCount <= 0) return 0;
  return Math.min(Math.max(0, index), navCount - 1);
}

/**
 * Apply one key to the focus snapshot. Enter may return `activate` for the caller to handle
 * (logging, IPC, navigation) without coupling this module to side effects.
 */
export function applyFocusKey(
  prev: FocusSnapshot,
  key: FocusKey,
  home: HomeScreenData,
): FocusActionResult {
  const navCount = home.nav.length;
  const rowCount = home.rows.length;

  if (key === "Escape") {
    if (prev.section === "hero" || prev.section === "row") {
      return { next: { ...prev, section: "sidebar" } };
    }
    return { next: prev };
  }

  if (key === "Enter") {
    if (prev.section === "sidebar") {
      const item = home.nav[prev.sidebarIndex];
      if (item) {
        return { next: prev, activate: { context: "sidebar", id: item.id } };
      }
      return { next: prev };
    }
    if (prev.section === "hero") {
      return { next: prev, activate: { context: "hero", id: "hero-primary" } };
    }
    if (prev.section === "row") {
      const tile = home.rows[prev.rowIndex]?.tiles[prev.colIndex];
      if (tile && !tile.disabled) {
        return { next: prev, activate: { context: "tile", id: tile.id } };
      }
    }
    return { next: prev };
  }

  const f = prev;

  switch (f.section) {
    case "sidebar": {
      if (key === "ArrowUp") {
        return { next: { ...f, sidebarIndex: clampSidebarIndex(f.sidebarIndex - 1, navCount) } };
      }
      if (key === "ArrowDown") {
        return { next: { ...f, sidebarIndex: clampSidebarIndex(f.sidebarIndex + 1, navCount) } };
      }
      if (key === "ArrowRight") {
        return {
          next: {
            ...f,
            section: "hero",
            rowIndex: 0,
            colIndex: rowCount > 0 ? firstEnabledCol(rowTiles(home, 0), 0) : 0,
          },
        };
      }
      return { next: f };
    }
    case "hero": {
      if (key === "ArrowLeft") {
        return { next: { ...f, section: "sidebar" } };
      }
      if (key === "ArrowUp" || key === "ArrowRight" || key === "ArrowDown") {
        if (rowCount === 0) {
          return { next: f };
        }
        return {
          next: {
            ...f,
            section: "row",
            rowIndex: 0,
            colIndex: firstEnabledCol(rowTiles(home, 0), 0),
          },
        };
      }
      return { next: f };
    }
    case "row": {
      const tiles = rowTiles(home, f.rowIndex);
      if (key === "ArrowLeft") {
        const next = nextEnabledCol(tiles, f.colIndex, -1);
        if (next >= 0) {
          return { next: { ...f, colIndex: next } };
        }
        return { next: { ...f, section: "sidebar" } };
      }
      if (key === "ArrowRight") {
        const next = nextEnabledCol(tiles, f.colIndex, 1);
        if (next >= 0) {
          return { next: { ...f, colIndex: next } };
        }
        return { next: f };
      }
      if (key === "ArrowUp") {
        if (f.rowIndex === 0) {
          return { next: { ...f, section: "hero" } };
        }
        const r = f.rowIndex - 1;
        const prevRowTiles = rowTiles(home, r);
        const col = Math.min(f.colIndex, lastEnabledCol(prevRowTiles));
        return {
          next: {
            ...f,
            section: "row",
            rowIndex: r,
            colIndex: firstEnabledCol(prevRowTiles, col),
          },
        };
      }
      if (key === "ArrowDown") {
        if (f.rowIndex >= rowCount - 1) {
          return { next: f };
        }
        const r = f.rowIndex + 1;
        const nextRowTiles = rowTiles(home, r);
        const col = Math.min(f.colIndex, lastEnabledCol(nextRowTiles));
        return {
          next: {
            ...f,
            rowIndex: r,
            colIndex: firstEnabledCol(nextRowTiles, col),
          },
        };
      }
      return { next: f };
    }
    default:
      return { next: f };
  }
}

export function parseFocusKey(raw: string): FocusKey | null {
  if (
    raw === "ArrowUp" ||
    raw === "ArrowDown" ||
    raw === "ArrowLeft" ||
    raw === "ArrowRight" ||
    raw === "Enter" ||
    raw === "Escape"
  ) {
    return raw;
  }
  return null;
}
