import { useLauncherGamepad } from "@/hooks/useLauncherGamepad.ts";
import { useFocusStore } from "@/store/focusStore.ts";
import { minimalHome } from "@/test/fixtures/homeScreen.ts";
import { resetFocusStore } from "@/test/resetFocusStore.ts";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeButton(pressed: boolean): GamepadButton {
  return {
    pressed,
    touched: pressed,
    value: pressed ? 1 : 0,
  };
}

function makeGamepad(buttons: GamepadButton[], axes: number[] = [0, 0]): Gamepad {
  return {
    connected: true,
    id: "test",
    index: 0,
    mapping: "standard",
    timestamp: 0,
    vibrationActuator: {} as GamepadHapticActuator,
    buttons,
    axes,
  } as Gamepad;
}

/** D-pad right is index 15 in the mapping used by the hook. */
function pad16(pressedIndices: number[] = []) {
  const buttons: GamepadButton[] = [];
  for (let i = 0; i < 16; i++) {
    buttons.push(makeButton(pressedIndices.includes(i)));
  }
  return makeGamepad(buttons);
}

describe("useLauncherGamepad", () => {
  const home = minimalHome();
  const rafQueue: FrameRequestCallback[] = [];
  const getGamepadsMock = vi.fn((): Gamepad[] => []);

  beforeEach(() => {
    resetFocusStore();
    rafQueue.length = 0;
    getGamepadsMock.mockReset();
    getGamepadsMock.mockImplementation(() => []);
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: getGamepadsMock,
    });
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback): number => {
        rafQueue.push(cb);
        return rafQueue.length;
      },
    );
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushOneFrame() {
    const cb = rafQueue.shift();
    if (cb) {
      cb(performance.now());
    }
  }

  it("fires ArrowRight on d-pad right edge (button 15)", () => {
    let call = 0;
    getGamepadsMock.mockImplementation(() => {
      call += 1;
      const pad = call === 1 ? pad16([]) : pad16([15]);
      return [pad] as unknown as Gamepad[];
    });

    renderHook(() => useLauncherGamepad(home));
    flushOneFrame();
    flushOneFrame();
    expect(useFocusStore.getState().focus.section).toBe("hero");
  });

  it("fires Enter on button 0 edge only once while held", () => {
    const onActivate = vi.fn();
    let call = 0;
    getGamepadsMock.mockImplementation(() => {
      call += 1;
      const pad = call === 1 ? pad16([]) : pad16([0]);
      return [pad] as unknown as Gamepad[];
    });

    renderHook(() => useLauncherGamepad(home, { onActivate }));
    flushOneFrame();
    flushOneFrame();
    expect(onActivate).toHaveBeenCalledTimes(1);
    flushOneFrame();
    flushOneFrame();
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("fires stick direction once from neutral", () => {
    let call = 0;
    getGamepadsMock.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return [makeGamepad([makeButton(false)], [0, 0])] as unknown as Gamepad[];
      }
      return [makeGamepad([makeButton(false)], [0.9, 0])] as unknown as Gamepad[];
    });

    renderHook(() => useLauncherGamepad(home));
    flushOneFrame();
    flushOneFrame();
    expect(useFocusStore.getState().focus.section).toBe("hero");
  });
});
