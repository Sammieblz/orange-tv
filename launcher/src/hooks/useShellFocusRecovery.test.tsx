import { useShellFocusRecovery } from "@/hooks/useShellFocusRecovery.ts";
import { useFocusStore } from "@/store/focusStore.ts";
import { resetFocusStore } from "@/test/resetFocusStore.ts";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useShellFocusRecovery", () => {
  const origVisibility = Object.getOwnPropertyDescriptor(
    Document.prototype,
    "visibilityState",
  );

  beforeEach(() => {
    resetFocusStore();
    vi.stubGlobal("orangeTv", undefined);
  });

  afterEach(() => {
    if (origVisibility) {
      Object.defineProperty(Document.prototype, "visibilityState", origVisibility);
    }
    vi.unstubAllGlobals();
  });

  it("restores checkpoint when shell foreground callback runs", () => {
    useFocusStore.getState().setFocus({
      section: "row",
      sidebarIndex: 0,
      rowIndex: 0,
      colIndex: 2,
    });
    useFocusStore.getState().requestShellFocusRestore();
    useFocusStore.getState().setFocus({
      section: "sidebar",
      sidebarIndex: 1,
      rowIndex: 0,
      colIndex: 0,
    });

    const unsub = vi.fn();
    window.orangeTv = {
      ping: async () => "pong",
      launchRequest: async () => ({ ok: true }),
      getRuntimeMetadata: async () => ({
        shellProfile: "appliance",
        channel: "test",
      }),
      onShellForeground: (cb: () => void) => {
        cb();
        return unsub;
      },
    };

    renderHook(() => useShellFocusRecovery());

    expect(useFocusStore.getState().focus).toEqual({
      section: "row",
      sidebarIndex: 0,
      rowIndex: 0,
      colIndex: 2,
    });
    expect(unsub).not.toHaveBeenCalled();
  });

  it("does not consume when document is hidden", () => {
    Object.defineProperty(Document.prototype, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });

    useFocusStore.getState().setFocus({
      section: "row",
      sidebarIndex: 0,
      rowIndex: 0,
      colIndex: 2,
    });
    useFocusStore.getState().requestShellFocusRestore();
    useFocusStore.getState().setFocus({
      section: "sidebar",
      sidebarIndex: 1,
      rowIndex: 0,
      colIndex: 0,
    });

    renderHook(() => useShellFocusRecovery());
    window.dispatchEvent(new Event("focus"));

    expect(useFocusStore.getState().focus.section).toBe("sidebar");
  });

  it("unsubscribes on unmount", () => {
    const unsub = vi.fn();
    window.orangeTv = {
      ping: async () => "pong",
      launchRequest: async () => ({ ok: true }),
      getRuntimeMetadata: async () => ({
        shellProfile: "appliance",
        channel: "test",
      }),
      onShellForeground: () => unsub,
    };

    const { unmount } = renderHook(() => useShellFocusRecovery());
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});
