import { useEffect, useRef } from "react";
import type { HomeScreenData } from "@/data/seedHome.ts";
import {
  useFocusInputDispatch,
  type FocusActivatePayload,
} from "@/hooks/useFocusInputDispatch.ts";
import type { FocusKey } from "@/navigation/focusNavigation.ts";

const STICK_DEADZONE = 0.35;
const STICK_RELEASE = 0.2;

function firstConnectedGamepad(): Gamepad | null {
  const list = navigator.getGamepads?.() ?? [];
  for (let i = 0; i < list.length; i++) {
    const gp = list[i];
    if (gp?.connected) {
      return gp;
    }
  }
  return null;
}

function pressed(b: GamepadButton | undefined): boolean {
  return !!b && (b.pressed || (b.value ?? 0) > 0.4);
}

function stickToDirection(ax: number, ay: number): FocusKey | null {
  const m = Math.hypot(ax, ay);
  if (m < STICK_DEADZONE) return null;
  if (Math.abs(ax) >= Math.abs(ay)) {
    return ax > 0 ? "ArrowRight" : "ArrowLeft";
  }
  return ay > 0 ? "ArrowDown" : "ArrowUp";
}

const DPAD_TO_KEY: Partial<Record<number, FocusKey>> = {
  12: "ArrowUp",
  13: "ArrowDown",
  14: "ArrowLeft",
  15: "ArrowRight",
};

export interface LauncherGamepadOptions {
  onActivate?: (payload: FocusActivatePayload) => void;
}

/**
 * Baseline: first connected gamepad only. Edge-trigger only (no hold-to-repeat).
 * See docs/gamepad-focus-recovery.md for mapping gaps.
 */
export function useLauncherGamepad(
  home: HomeScreenData,
  options?: LauncherGamepadOptions,
) {
  const dispatchFocusKey = useFocusInputDispatch(home, { onActivate: options?.onActivate });
  const rafRef = useRef<number>(0);
  const prevButtonsRef = useRef<boolean[]>([]);
  const stickNeutralRef = useRef(true);

  useEffect(() => {
    const tick = () => {
      const gp = firstConnectedGamepad();
      if (!gp) {
        prevButtonsRef.current = [];
        stickNeutralRef.current = true;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const buttons = gp.buttons;
      const prev = prevButtonsRef.current;
      const newPrev: boolean[] = [];

      const fire = (key: FocusKey) => {
        dispatchFocusKey(key);
      };

      for (let i = 0; i < buttons.length; i++) {
        const now = pressed(buttons[i]);
        const was = prev[i] ?? false;
        newPrev[i] = now;
        if (now && !was) {
          if (i === 0) {
            fire("Enter");
          } else if (i === 1) {
            fire("Escape");
          } else {
            const dk = DPAD_TO_KEY[i];
            if (dk) {
              fire(dk);
            }
          }
        }
      }
      prevButtonsRef.current = newPrev;

      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      const dir = stickToDirection(ax, ay);
      const neutral = Math.hypot(ax, ay) < STICK_RELEASE;

      if (neutral) {
        stickNeutralRef.current = true;
      } else if (stickNeutralRef.current && dir) {
        stickNeutralRef.current = false;
        fire(dir);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dispatchFocusKey]);
}
