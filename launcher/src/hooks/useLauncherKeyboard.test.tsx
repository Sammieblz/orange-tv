import { useLauncherKeyboard } from "@/hooks/useLauncherKeyboard.ts";
import { useFocusStore } from "@/store/focusStore.ts";
import { minimalHome } from "@/test/fixtures/homeScreen.ts";
import { resetFocusStore } from "@/test/resetFocusStore.ts";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("useLauncherKeyboard", () => {
  const home = minimalHome();

  beforeEach(() => {
    resetFocusStore();
  });

  it("dispatches mapped keys from keydown", () => {
    renderHook(() => useLauncherKeyboard(home));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(useFocusStore.getState().focus.section).toBe("hero");
  });

  it("ignores keys when meta is held", () => {
    renderHook(() => useLauncherKeyboard(home));
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        metaKey: true,
      }),
    );
    expect(useFocusStore.getState().focus.section).toBe("sidebar");
  });

  it("calls preventDefault for handled keys", () => {
    renderHook(() => useLauncherKeyboard(home));
    const ev = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    const spy = vi.spyOn(ev, "preventDefault");
    window.dispatchEvent(ev);
    expect(spy).toHaveBeenCalled();
  });
});
