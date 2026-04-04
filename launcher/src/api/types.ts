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
