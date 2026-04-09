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
