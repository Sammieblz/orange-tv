import { useCallback, useRef } from "react";
import type { HomeScreenData } from "@/data/seedHome.ts";
import { applyFocusKey, type FocusKey } from "@/navigation/focusNavigation.ts";
import { useFocusStore } from "@/store/focusStore.ts";

export type FocusActivatePayload = { context: "sidebar" | "hero" | "tile"; id: string };

export function useFocusInputDispatch(
  home: HomeScreenData,
  options?: { onActivate?: (payload: FocusActivatePayload) => void },
) {
  const onActivateRef = useRef(options?.onActivate);
  onActivateRef.current = options?.onActivate;

  return useCallback(
    (key: FocusKey) => {
      useFocusStore.getState().setFocus((prev) => {
        const { next, activate } = applyFocusKey(prev, key, home);
        if (activate) {
          const cb = onActivateRef.current;
          if (cb) {
            cb(activate);
          } else {
            console.log("[launcher] activate", activate.context, activate.id);
          }
        }
        return next;
      });
    },
    [home],
  );
}
