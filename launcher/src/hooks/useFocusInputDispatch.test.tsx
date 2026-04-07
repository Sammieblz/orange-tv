import { useFocusInputDispatch } from "@/hooks/useFocusInputDispatch.ts";
import { applyFocusKey } from "@/navigation/focusNavigation.ts";
import { useFocusStore } from "@/store/focusStore.ts";
import { minimalHome } from "@/test/fixtures/homeScreen.ts";
import { resetFocusStore } from "@/test/resetFocusStore.ts";
import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("useFocusInputDispatch", () => {
  const home = minimalHome();

  beforeEach(() => {
    resetFocusStore();
  });

  it("updates focus to match applyFocusKey for one step", () => {
    const prev = { ...useFocusStore.getState().focus };
    const { result } = renderHook(() => useFocusInputDispatch(home));
    act(() => {
      result.current("ArrowRight");
    });
    const { next } = applyFocusKey(prev, "ArrowRight", home);
    expect(useFocusStore.getState().focus).toEqual(next);
  });

  it("calls onActivate on Enter", () => {
    const onActivate = vi.fn();
    const { result } = renderHook(() =>
      useFocusInputDispatch(home, { onActivate }),
    );
    act(() => {
      result.current("Enter");
    });
    expect(onActivate).toHaveBeenCalledWith({
      context: "sidebar",
      id: "nav-a",
    });
  });
});
