import {
  consumeShellFocusRestoreIfPending,
  useFocusStore,
} from "@/store/focusStore.ts";
import { beforeEach, describe, expect, it } from "vitest";

const baseline = {
  focus: {
    section: "sidebar" as const,
    sidebarIndex: 0,
    rowIndex: 0,
    colIndex: 0,
  },
  focusCheckpoint: null,
  shellRestorePending: false,
};

function resetStore() {
  useFocusStore.setState(baseline);
}

describe("useFocusStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("setFocus", () => {
    it("applies object snapshot", () => {
      useFocusStore.getState().setFocus({
        section: "row",
        sidebarIndex: 0,
        rowIndex: 1,
        colIndex: 2,
      });
      expect(useFocusStore.getState().focus).toEqual({
        section: "row",
        sidebarIndex: 0,
        rowIndex: 1,
        colIndex: 2,
      });
    });

    it("applies functional updater", () => {
      useFocusStore.getState().setFocus((prev) => ({
        ...prev,
        sidebarIndex: 1,
      }));
      expect(useFocusStore.getState().focus.sidebarIndex).toBe(1);
    });
  });

  describe("saveFocusCheckpoint", () => {
    it("copies current focus only", () => {
      useFocusStore.getState().setFocus({
        section: "hero",
        sidebarIndex: 0,
        rowIndex: 0,
        colIndex: 0,
      });
      useFocusStore.getState().saveFocusCheckpoint();
      // Mutate focus
      useFocusStore.getState().setFocus({ section: "sidebar", sidebarIndex: 2, rowIndex: 0, colIndex: 0 });
      const cp = useFocusStore.getState().focusCheckpoint;
      expect(cp).toEqual({
        section: "hero",
        sidebarIndex: 0,
        rowIndex: 0,
        colIndex: 0,
      });
    });
  });

  describe("restoreFocusCheckpoint", () => {
    it("copies checkpoint back and clears", () => {
      useFocusStore.getState().setFocus({
        section: "row",
        sidebarIndex: 0,
        rowIndex: 1,
        colIndex: 0,
      });
      useFocusStore.getState().saveFocusCheckpoint();
      useFocusStore.getState().setFocus({ section: "sidebar", sidebarIndex: 0, rowIndex: 0, colIndex: 0 });
      useFocusStore.getState().restoreFocusCheckpoint();
      expect(useFocusStore.getState().focus).toEqual({
        section: "row",
        sidebarIndex: 0,
        rowIndex: 1,
        colIndex: 0,
      });
      expect(useFocusStore.getState().focusCheckpoint).toBeNull();
      expect(useFocusStore.getState().shellRestorePending).toBe(false);
    });

    it("no checkpoint only clears shellRestorePending", () => {
      useFocusStore.setState({ shellRestorePending: true });
      useFocusStore.getState().restoreFocusCheckpoint();
      expect(useFocusStore.getState().shellRestorePending).toBe(false);
    });
  });

  describe("clearFocusCheckpoint", () => {
    it("clears checkpoint and pending without changing focus", () => {
      useFocusStore.getState().setFocus({
        section: "row",
        sidebarIndex: 0,
        rowIndex: 0,
        colIndex: 1,
      });
      useFocusStore.getState().requestShellFocusRestore();
      useFocusStore.getState().clearFocusCheckpoint();
      expect(useFocusStore.getState().focus).toEqual({
        section: "row",
        sidebarIndex: 0,
        rowIndex: 0,
        colIndex: 1,
      });
      expect(useFocusStore.getState().focusCheckpoint).toBeNull();
      expect(useFocusStore.getState().shellRestorePending).toBe(false);
    });
  });

  describe("requestShellFocusRestore", () => {
    it("saves checkpoint and sets pending", () => {
      useFocusStore.getState().setFocus({
        section: "row",
        sidebarIndex: 0,
        rowIndex: 0,
        colIndex: 2,
      });
      useFocusStore.getState().requestShellFocusRestore();
      expect(useFocusStore.getState().focusCheckpoint).toEqual({
        section: "row",
        sidebarIndex: 0,
        rowIndex: 0,
        colIndex: 2,
      });
      expect(useFocusStore.getState().shellRestorePending).toBe(true);
    });
  });
});

describe("consumeShellFocusRestoreIfPending", () => {
  beforeEach(() => {
    resetStore();
  });

  it("restores when pending and checkpoint exist", () => {
    useFocusStore.getState().setFocus({
      section: "row",
      sidebarIndex: 0,
      rowIndex: 0,
      colIndex: 2,
    });
    useFocusStore.getState().requestShellFocusRestore();
    useFocusStore.getState().setFocus({ section: "sidebar", sidebarIndex: 1, rowIndex: 0, colIndex: 0 });
    consumeShellFocusRestoreIfPending();
    expect(useFocusStore.getState().focus).toEqual({
      section: "row",
      sidebarIndex: 0,
      rowIndex: 0,
      colIndex: 2,
    });
    expect(useFocusStore.getState().focusCheckpoint).toBeNull();
    expect(useFocusStore.getState().shellRestorePending).toBe(false);
  });

  it("does nothing when not pending", () => {
    useFocusStore.getState().setFocus({
      section: "row",
      sidebarIndex: 0,
      rowIndex: 0,
      colIndex: 2,
    });
    useFocusStore.getState().saveFocusCheckpoint();
    useFocusStore.getState().setFocus({ section: "sidebar", sidebarIndex: 1, rowIndex: 0, colIndex: 0 });
    consumeShellFocusRestoreIfPending();
    expect(useFocusStore.getState().focus.section).toBe("sidebar");
    expect(useFocusStore.getState().focusCheckpoint).not.toBeNull();
  });

  it("does nothing when pending but checkpoint null", () => {
    useFocusStore.setState({
      ...baseline,
      shellRestorePending: true,
      focusCheckpoint: null,
    });
    useFocusStore.getState().setFocus({ section: "sidebar", sidebarIndex: 1, rowIndex: 0, colIndex: 0 });
    consumeShellFocusRestoreIfPending();
    expect(useFocusStore.getState().focus.sidebarIndex).toBe(1);
    expect(useFocusStore.getState().shellRestorePending).toBe(true);
  });
});
