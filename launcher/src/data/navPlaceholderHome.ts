import type { HomeScreenData } from "@/data/seedHome.ts";
import { SEED_HOME } from "@/data/seedHome.ts";
import type { MainNavId } from "@/store/navViewStore.ts";

const COPY: Record<Exclude<MainNavId, "home" | "apps">, { title: string; subtitle: string }> = {
  library: {
    title: "Library",
    subtitle: "Browse local media and history — full library UI is not wired yet.",
  },
  settings: {
    title: "Settings",
    subtitle: "Launcher and system preferences — screen not built yet.",
  },
};

/** Minimal home model for focus navigation on Library / Settings (Apps uses `buildAppsCatalogHome`). */
export function buildNavPlaceholderHome(navId: Exclude<MainNavId, "home" | "apps">): HomeScreenData {
  const c = COPY[navId];
  return {
    nav: SEED_HOME.nav,
    hero: {
      title: c.title,
      subtitle: c.subtitle,
      backgroundImageUrl: null,
    },
    rows: [
      {
        id: "nav-placeholder",
        title: "",
        tiles: [
          {
            id: "nav-placeholder-hint",
            title:
              "Select Home in the left rail and press Enter to return to the main home screen.",
            disabled: true,
          },
        ],
      },
    ],
  };
}
