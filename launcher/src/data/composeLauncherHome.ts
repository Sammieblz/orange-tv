import type { AppDto, ContinueWatchingItemDto, HomeRecommendationsDto } from "@/api/types.ts";
import type { ApiSliceStatus } from "@/data/apiSliceStatus.ts";
import { mergeHomeScreenWithApps } from "@/data/mergeHomeWithApps.ts";
import { mergeHomeWithContinueWatching } from "@/data/mergeHomeWithContinueWatching.ts";
import { mergeHomeWithRecommendations } from "@/data/mergeHomeWithRecommendations.ts";
import { SEED_HOME, type HomeScreenData } from "@/data/seedHome.ts";

export interface ComposeLauncherHomeInput {
  continueItems: ContinueWatchingItemDto[] | undefined;
  /** From `useQuery` `status` — distinguishes stuck “Loading…” vs error vs real empty data. */
  continueStatus: ApiSliceStatus;
  recommendations: HomeRecommendationsDto | undefined;
  recommendationsStatus: ApiSliceStatus;
  apps: AppDto[] | undefined;
  appsStatus: ApiSliceStatus;
}

/**
 * Single composition pipeline: shell + rows from `SEED_HOME` (placeholders), then overlay
 * Continue Watching, rules recommendations, and the streaming catalog from `GET /api/v1/apps`.
 */
export function composeLauncherHome(input: ComposeLauncherHomeInput): HomeScreenData {
  const {
    continueItems,
    continueStatus,
    recommendations,
    recommendationsStatus,
    apps,
    appsStatus,
  } = input;
  return mergeHomeScreenWithApps(
    mergeHomeWithRecommendations(
      mergeHomeWithContinueWatching(SEED_HOME, continueItems, continueStatus),
      recommendations,
      recommendationsStatus,
    ),
    apps,
    appsStatus,
  );
}
