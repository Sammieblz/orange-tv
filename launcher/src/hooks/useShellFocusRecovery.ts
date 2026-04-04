import { useEffect } from "react";
import { consumeShellFocusRestoreIfPending } from "@/store/focusStore.ts";

function tryConsume() {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    return;
  }
  consumeShellFocusRestoreIfPending();
}

/**
 * Restores focus checkpoint when the shell returns to the foreground, but only if
 * `requestShellFocusRestore()` was called before an external handoff.
 */
export function useShellFocusRecovery() {
  useEffect(() => {
    const onVisibility = () => {
      tryConsume();
    };

    const onWinFocus = () => {
      tryConsume();
    };

    window.addEventListener("focus", onWinFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const unsubShell = window.orangeTv?.onShellForeground?.(() => {
      tryConsume();
    });

    return () => {
      window.removeEventListener("focus", onWinFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubShell?.();
    };
  }, []);
}
