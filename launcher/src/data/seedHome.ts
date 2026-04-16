export interface NavItem {
  id: string;
  label: string;
  /** Short label for collapsed rail */
  shortLabel: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  /** Optional; shell falls back to gradient */
  backgroundImageUrl: string | null;
}

export interface TileDescriptor {
  id: string;
  title: string;
  imageUrl?: string;
  disabled?: boolean;
  /** 0–1 watched fraction for continue-watching style */
  progress?: number;
  /** Short line from API session metadata (chrome targets); not a guarantee of login state */
  sessionHint?: string;
}

export interface HomeRow {
  id: string;
  title: string;
  tiles: TileDescriptor[];
}

export interface HomeScreenData {
  nav: NavItem[];
  hero: HeroContent;
  rows: HomeRow[];
}

export const SEED_HOME: HomeScreenData = {
  nav: [
    { id: "home", label: "Home", shortLabel: "Hm" },
    { id: "library", label: "Library", shortLabel: "Lib" },
    { id: "apps", label: "Apps", shortLabel: "Apps" },
    { id: "settings", label: "Settings", shortLabel: "Set" },
  ],
  hero: {
    title: "Pick up where you left off",
    subtitle: "Your couch, your queue — local-first and fast.",
    backgroundImageUrl: null,
  },
  rows: [
    {
      id: "continue",
      title: "Continue watching",
      tiles: [{ id: "continue-loading", title: "Loading…", disabled: true }],
    },
    {
      id: "recent",
      title: "Recent",
      tiles: [
        { id: "recent-ph-1", title: "Loading…" },
        { id: "recent-ph-2", title: "Loading…" },
      ],
    },
    {
      id: "top-apps",
      title: "Top apps",
      tiles: [{ id: "top-ph-1", title: "Loading…" }],
    },
    {
      id: "picks",
      title: "Picks for you",
      tiles: [{ id: "picks-ph-1", title: "Loading…" }],
    },
    {
      id: "launch-demos",
      title: "Launch demos (SAM-15)",
      tiles: [
        {
          id: "launch-streaming-demo",
          title: "Chrome — example.com",
        },
        {
          id: "launch-mpv-demo",
          title: "MPV — sample file",
        },
      ],
    },
    {
      id: "streaming",
      title: "Streaming",
      tiles: [{ id: "streaming-loading", title: "Loading…", disabled: true }],
    },
    {
      id: "games",
      title: "Games",
      tiles: [{ id: "games-coming-soon", title: "Coming soon", disabled: true }],
    },
  ],
};
