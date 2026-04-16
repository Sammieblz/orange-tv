import { create } from "zustand";

export interface LaunchFeedbackState {
  /** Short line for the status bar (launch outcome). */
  line: string | null;
  variant: "success" | "error" | null;
  /** Success clears after a short delay; errors stay until the next outcome. */
  setOutcome: (ok: boolean, detail?: string) => void;
}

let successClearTimer: ReturnType<typeof setTimeout> | undefined;

export const useLaunchFeedbackStore = create<LaunchFeedbackState>((set) => ({
  line: null,
  variant: null,

  setOutcome: (ok, detail) => {
    if (successClearTimer !== undefined) {
      clearTimeout(successClearTimer);
      successClearTimer = undefined;
    }
    if (ok) {
      set({ line: "Launch started", variant: "success" });
      successClearTimer = setTimeout(() => {
        set({ line: null, variant: null });
        successClearTimer = undefined;
      }, 4000);
      return;
    }
    const trimmed = detail?.trim();
    set({
      line: trimmed ? `Launch failed: ${trimmed}` : "Launch failed",
      variant: "error",
    });
  },
}));

/** Test helper: reset store between Vitest cases. */
export function resetLaunchFeedbackStore(): void {
  if (successClearTimer !== undefined) {
    clearTimeout(successClearTimer);
    successClearTimer = undefined;
  }
  useLaunchFeedbackStore.setState({ line: null, variant: null });
}
