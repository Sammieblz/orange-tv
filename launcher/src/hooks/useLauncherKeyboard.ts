import { useEffect } from "react";
import type { HomeScreenData } from "../data/seedHome";
import { useFocusStore } from "../store/focusStore";

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

export function useLauncherKeyboard(home: HomeScreenData) {
  const setFocus = useFocusStore((s) => s.setFocus);

  useEffect(() => {
    const navCount = home.nav.length;
    const rowCount = home.rows.length;
    const rowTiles = (r: number) => home.rows[r]?.tiles ?? [];

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const key = e.key;
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(key)) {
        return;
      }

      e.preventDefault();

      setFocus((prev) => {
        if (key === "Enter") {
          if (prev.section === "row") {
            const tile = home.rows[prev.rowIndex]?.tiles[prev.colIndex];
            if (tile && !tile.disabled) {
              console.log("[launcher] activate", tile.id);
            }
          }
          return prev;
        }

        const f = prev;

        switch (f.section) {
          case "sidebar": {
            if (key === "ArrowUp") {
              return {
                ...f,
                sidebarIndex: Math.max(0, f.sidebarIndex - 1),
              };
            }
            if (key === "ArrowDown") {
              return {
                ...f,
                sidebarIndex: Math.min(navCount - 1, f.sidebarIndex + 1),
              };
            }
            if (key === "ArrowRight") {
              return {
                ...f,
                section: "hero",
                rowIndex: 0,
                colIndex: rowCount > 0 ? firstEnabledCol(rowTiles(0), 0) : 0,
              };
            }
            return f;
          }
          case "hero": {
            if (key === "ArrowLeft") {
              return { ...f, section: "sidebar" };
            }
            if (key === "ArrowDown" && rowCount > 0) {
              return {
                ...f,
                section: "row",
                rowIndex: 0,
                colIndex: firstEnabledCol(rowTiles(0), 0),
              };
            }
            return f;
          }
          case "row": {
            const tiles = rowTiles(f.rowIndex);
            if (key === "ArrowLeft") {
              const next = nextEnabledCol(tiles, f.colIndex, -1);
              if (next >= 0) {
                return { ...f, colIndex: next };
              }
              return { ...f, section: "sidebar" };
            }
            if (key === "ArrowRight") {
              const next = nextEnabledCol(tiles, f.colIndex, 1);
              if (next >= 0) {
                return { ...f, colIndex: next };
              }
              return f;
            }
            if (key === "ArrowUp") {
              if (f.rowIndex === 0) {
                return { ...f, section: "hero" };
              }
              const r = f.rowIndex - 1;
              const prevRowTiles = rowTiles(r);
              const col = Math.min(f.colIndex, lastEnabledCol(prevRowTiles));
              return {
                ...f,
                section: "row",
                rowIndex: r,
                colIndex: firstEnabledCol(prevRowTiles, col),
              };
            }
            if (key === "ArrowDown") {
              if (f.rowIndex >= rowCount - 1) return f;
              const r = f.rowIndex + 1;
              const nextRowTiles = rowTiles(r);
              const col = Math.min(f.colIndex, lastEnabledCol(nextRowTiles));
              return {
                ...f,
                rowIndex: r,
                colIndex: firstEnabledCol(nextRowTiles, col),
              };
            }
            return f;
          }
          default:
            return f;
        }
      });
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [home, setFocus]);
}
