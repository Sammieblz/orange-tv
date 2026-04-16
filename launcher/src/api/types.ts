export interface PlatformStatusDto {
  osDescription: string;
  frameworkDescription: string;
  isWindows: boolean;
  isLinux: boolean;
  preferredDirectorySeparator: string;
  sampleNormalizedPath: string;
}

export interface WeatherForecastDto {
  date: string;
  temperatureC: number;
  summary: string | null;
  temperatureF: number;
}

export type SessionFreshness = "Unknown" | "LikelyActive" | "PossiblyStale" | "ResetSuggested";

export interface AppDto {
  id: string;
  label: string;
  type: string | null;
  launchUrl: string | null;
  sortOrder: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  chromeProfileSegment: string | null;
  sessionFreshness: SessionFreshness;
  lastSessionEndedAtUtc: string | null;
  lastSessionExitCode: number | null;
}

export interface AppsListDto {
  items: AppDto[];
}

export interface ActiveLaunchSessionDto {
  sessionId: string;
  appId: string;
  label: string;
  pid: number;
  startedAtUtc: string;
  kind: string;
  mediaItemId: string | null;
}

export interface ActiveLaunchSessionsDto {
  items: ActiveLaunchSessionDto[];
}

export interface ContinueWatchingItemDto {
  mediaItemId: string;
  title: string;
  thumbnailRelativePath: string | null;
  progress: number;
  lastPlayedAtUtc: string;
}

export interface ContinueWatchingListDto {
  items: ContinueWatchingItemDto[];
}

export interface HomeRecommendationsDto {
  engine: string;
  mlRanker: string;
  rankingRulesVersion: string;
  continueRankingRulesVersion: string;
  rows: RecommendationRowDto[];
}

export interface RecommendationRowDto {
  rowId: string;
  title: string;
  source: string;
  rankingRulesVersion: string;
  items: RecommendationItemDto[];
}

/** Mirrors API record: use <code>kind</code> to distinguish media vs app tiles. */
export interface RecommendationItemDto {
  kind: string;
  mediaItemId: string | null;
  appId: string | null;
  title: string | null;
  label: string | null;
  thumbnailRelativePath: string | null;
  progress: number | null;
}
