import { create } from "zustand";

/** Where keyboard focus lives in the TV shell; safe to extend for overlays later. */
export type FocusSection = "sidebar" | "hero" | "row";

export interface FocusSnapshot {
  section: FocusSection;
  /** Index into `HomeScreenData.nav` */
  sidebarIndex: number;
  /** Index into `HomeScreenData.rows` */
  rowIndex: number;
  /** Index into `rows[rowIndex].tiles` */
  colIndex: number;
}

const initial: FocusSnapshot = {
  section: "sidebar",
  sidebarIndex: 0,
  rowIndex: 0,
  colIndex: 0,
};

export const useFocusStore = create<{
  focus: FocusSnapshot;
  setFocus: (next: FocusSnapshot | ((prev: FocusSnapshot) => FocusSnapshot)) => void;
}>((set) => ({
  focus: initial,
  setFocus: (next) =>
    set((s) => ({
      focus: typeof next === "function" ? next(s.focus) : next,
    })),
}));
