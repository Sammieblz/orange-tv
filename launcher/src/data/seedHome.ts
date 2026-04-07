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
      tiles: [
        {
          id: "cw-1",
          title: "Episode 3 — The long night",
          progress: 0.62,
        },
        {
          id: "cw-2",
          title: "Concert — Live in Berlin",
          progress: 0.12,
        },
        {
          id: "cw-3",
          title: "Indie spotlight",
          progress: 0.95,
        },
      ],
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
      tiles: [
        { id: "app-tv", title: "Apple TV" },
        { id: "app-nf", title: "Netflix" },
        {
          id: "app-dis",
          title: "Unavailable",
          disabled: true,
        },
        { id: "app-pr", title: "Prime Video" },
      ],
    },
    {
      id: "games",
      title: "Games",
      tiles: [
        { id: "g-1", title: "Hollow Knight" },
        { id: "g-2", title: "Celeste" },
        { id: "g-3", title: "RetroArch" },
      ],
    },
  ],
};
