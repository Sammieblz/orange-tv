import { useEffect, useRef } from "react";
import { useWebShell } from "@/player/useWebShell.ts";
import styles from "./WebShellTopBar.module.css";

/**
 * Slim back-bar rendered above an active streaming BrowserView (SAM-61).
 *
 * The Electron main process insets the BrowserView by the matching
 * `WEB_SHELL_TOP_INSET_PX` so this bar stays visible as an overlay on the
 * launcher window. When no web shell is open, this component renders nothing.
 *
 * Exiting also works via the existing key capture in `web-shell-container.cjs`
 * (Escape / Backspace / Home); this bar is the discoverable, pointer-friendly
 * equivalent for users who need a visible affordance.
 */
export function WebShellTopBar() {
  const { state, close } = useWebShell();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (state.open) {
      // Auto-focus so keyboard Enter can immediately close the shell, matching TV UX.
      buttonRef.current?.focus();
    }
  }, [state.open]);

  if (!state.open) return null;

  const label =
    typeof state.appId === "string" && state.appId.length > 0
      ? state.appId
      : "Streaming";

  return (
    <div
      className={styles.bar}
      role="toolbar"
      aria-label={`Streaming surface for ${label}`}
      data-testid="web-shell-top-bar"
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.backButton}
        onClick={() => {
          void close();
        }}
        aria-label="Back to Orange TV"
      >
        <span aria-hidden="true" className={styles.backGlyph}>
          ←
        </span>
        <span>Back</span>
      </button>
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
    </div>
  );
}
