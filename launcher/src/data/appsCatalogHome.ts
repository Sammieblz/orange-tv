import type { AppDto } from "@/api/types.ts";
import type { ApiSliceStatus } from "@/data/apiSliceStatus.ts";
import type { HomeScreenData, TileDescriptor } from "@/data/seedHome.ts";
import { SEED_HOME } from "@/data/seedHome.ts";

function sessionHintForChromeTile(app: AppDto): string | undefined {
  if (app.type?.toLowerCase() !== "chrome") {
    return undefined;
  }
  switch (app.sessionFreshness) {
    case "LikelyActive":
      return "Last session ended normally";
    case "PossiblyStale":
      return "May need sign-in";
    case "ResetSuggested":
      return "Sign-in may be required";
    default:
      return undefined;
  }
}

function appDtoToTile(app: AppDto): TileDescriptor {
  return {
    id: `app:${app.id}`,
    title: app.label,
    sessionHint: sessionHintForChromeTile(app),
  };
}

/** Full-screen Apps rail: every row from `GET /api/v1/apps` as launchable `app:{id}` tiles. */
export function buildAppsCatalogHome(
  items: AppDto[] | undefined,
  status: ApiSliceStatus,
): HomeScreenData {
  if (status === "pending") {
    return {
      nav: SEED_HOME.nav,
      hero: {
        title: "Apps",
        subtitle: "Loading catalog from the local API…",
        backgroundImageUrl: null,
      },
      rows: [
        {
          id: "apps-catalog",
          title: "Catalog",
          tiles: [{ id: "apps-catalog-loading", title: "Loading…", disabled: true }],
        },
      ],
    };
  }

  if (status === "error") {
    return {
      nav: SEED_HOME.nav,
      hero: {
        title: "Apps",
        subtitle: "Could not load the app catalog. Check that the API is running (footer).",
        backgroundImageUrl: null,
      },
      rows: [
        {
          id: "apps-catalog",
          title: "Catalog",
          tiles: [
            {
              id: "apps-catalog-error",
              title: "Apps list failed — check VITE_ORANGETV_API_BASE_URL and API logs",
              disabled: true,
            },
          ],
        },
      ],
    };
  }

  const list = items ?? [];
  if (list.length === 0) {
    return {
      nav: SEED_HOME.nav,
      hero: {
        title: "Apps",
        subtitle: "No applications are registered in the local database yet.",
        backgroundImageUrl: null,
      },
      rows: [
        {
          id: "apps-catalog",
          title: "Catalog",
          tiles: [{ id: "apps-catalog-empty", title: "No apps in catalog", disabled: true }],
        },
      ],
    };
  }

  const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));

  return {
    nav: SEED_HOME.nav,
    hero: {
      title: "Apps",
      subtitle: `${sorted.length} application${sorted.length === 1 ? "" : "s"} from the local service. Select a tile to launch.`,
      backgroundImageUrl: null,
    },
    rows: [
      {
        id: "apps-catalog",
        title: "All apps",
        tiles: sorted.map(appDtoToTile),
      },
    ],
  };
}
