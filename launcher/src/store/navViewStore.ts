import { create } from "zustand";

/** Matches `SEED_HOME.nav` item ids. */
export type MainNavId = "home" | "library" | "apps" | "settings";

const KNOWN: ReadonlySet<string> = new Set(["home", "library", "apps", "settings"]);

export interface NavViewState {
  /** Which main rail destination is shown. `home` is the full launcher feed; others are placeholders until those surfaces ship. */
  activeMainNavId: MainNavId;
  setActiveMainNavId: (id: string) => void;
}

export const useNavViewStore = create<NavViewState>((set) => ({
  activeMainNavId: "home",
  setActiveMainNavId: (id) => {
    if (KNOWN.has(id)) {
      set({ activeMainNavId: id as MainNavId });
    }
  },
}));

export function resetNavViewStore(): void {
  useNavViewStore.setState({ activeMainNavId: "home" });
}
