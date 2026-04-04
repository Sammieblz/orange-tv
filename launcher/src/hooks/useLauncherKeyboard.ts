import { useEffect, useRef } from "react";
import type { HomeScreenData } from "@/data/seedHome.ts";
import { applyFocusKey, parseFocusKey } from "@/navigation/focusNavigation.ts";
import { useFocusStore } from "@/store/focusStore.ts";

export interface LauncherKeyboardOptions {
  home: HomeScreenData;
  /** Optional; default logs to console. */
  onActivate?: (payload: { context: "sidebar" | "hero" | "tile"; id: string }) => void;
}

export function useLauncherKeyboard(
  home: HomeScreenData,
  options?: Pick<LauncherKeyboardOptions, "onActivate">,
) {
  const setFocus = useFocusStore((s) => s.setFocus);
  const onActivateRef = useRef(options?.onActivate);
  onActivateRef.current = options?.onActivate;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const key = parseFocusKey(e.key);
      if (key === null) return;

      e.preventDefault();

      setFocus((prev) => {
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
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [home, setFocus]);
}
