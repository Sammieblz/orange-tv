import { useEffect } from "react";
import type { HomeScreenData } from "@/data/seedHome.ts";
import { useFocusInputDispatch, type FocusActivatePayload } from "@/hooks/useFocusInputDispatch.ts";
import { parseFocusKey } from "@/navigation/focusNavigation.ts";

export interface LauncherKeyboardOptions {
  home: HomeScreenData;
  /** Optional; default logs to console. */
  onActivate?: (payload: FocusActivatePayload) => void;
}

export function useLauncherKeyboard(
  home: HomeScreenData,
  options?: Pick<LauncherKeyboardOptions, "onActivate">,
) {
  const dispatchFocusKey = useFocusInputDispatch(home, { onActivate: options?.onActivate });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const key = parseFocusKey(e.key);
      if (key === null) return;

      e.preventDefault();
      dispatchFocusKey(key);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatchFocusKey]);
}
