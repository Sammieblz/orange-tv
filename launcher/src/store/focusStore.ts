import { create } from "zustand";

/** Where keyboard focus lives in the TV shell; transitions in `navigation/focusNavigation.ts`. Overlays: see `docs/focus-navigation.md`. */
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

export interface FocusStoreState {
  focus: FocusSnapshot;
  /** Saved logical focus for modal restore or shell-return. */
  focusCheckpoint: FocusSnapshot | null;
  /** When true, next shell foreground / visibility / window focus may consume checkpoint. */
  shellRestorePending: boolean;
  setFocus: (next: FocusSnapshot | ((prev: FocusSnapshot) => FocusSnapshot)) => void;
  /** Copy current focus only (e.g. before opening an overlay). */
  saveFocusCheckpoint: () => void;
  /** Apply checkpoint once and clear checkpoint + pending. */
  restoreFocusCheckpoint: () => void;
  /** Clear checkpoint and pending without changing focus. */
  clearFocusCheckpoint: () => void;
  /** Save current focus and arm deferred restore after external blur (e.g. launched app). */
  requestShellFocusRestore: () => void;
}

export const useFocusStore = create<FocusStoreState>((set) => ({
  focus: initial,
  focusCheckpoint: null,
  shellRestorePending: false,

  setFocus: (next) =>
    set((s) => ({
      focus: typeof next === "function" ? next(s.focus) : next,
    })),

  saveFocusCheckpoint: () =>
    set((s) => ({
      focusCheckpoint: { ...s.focus },
    })),

  restoreFocusCheckpoint: () =>
    set((s) => {
      if (!s.focusCheckpoint) {
        return { shellRestorePending: false };
      }
      return {
        focus: { ...s.focusCheckpoint },
        focusCheckpoint: null,
        shellRestorePending: false,
      };
    }),

  clearFocusCheckpoint: () =>
    set({
      focusCheckpoint: null,
      shellRestorePending: false,
    }),

  requestShellFocusRestore: () =>
    set((s) => ({
      focusCheckpoint: { ...s.focus },
      shellRestorePending: true,
    })),
}));

export function consumeShellFocusRestoreIfPending(): void {
  const s = useFocusStore.getState();
  if (s.shellRestorePending && s.focusCheckpoint !== null) {
    s.restoreFocusCheckpoint();
  }
}
