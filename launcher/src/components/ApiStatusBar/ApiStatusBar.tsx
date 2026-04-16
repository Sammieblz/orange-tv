import { getApiBaseUrl } from "@/api/client.ts";
import { usePlatformStatus } from "@/api/queries/usePlatformStatus.ts";
import { useWeatherForecast } from "@/api/queries/useWeatherForecast.ts";
import { useLaunchFeedbackStore } from "@/store/launchFeedbackStore.ts";
import styles from "./ApiStatusBar.module.css";

export function ApiStatusBar() {
  const launchLine = useLaunchFeedbackStore((s) => s.line);
  const launchVariant = useLaunchFeedbackStore((s) => s.variant);
  const platform = usePlatformStatus();
  const weather = useWeatherForecast();

  const apiLabel = platform.isPending
    ? "API: connecting…"
    : platform.isError
      ? "API: offline"
      : "API: connected";

  const forecastHint = weather.isSuccess
    ? `Forecast rows: ${weather.data.length}`
    : weather.isError
      ? "Forecast: unavailable"
      : null;

  const detail =
    platform.data != null
      ? `${platform.data.isLinux ? "Linux" : platform.data.isWindows ? "Windows" : "OS"} · ${platform.data.frameworkDescription.split(" ")[0]}`
      : platform.isError
        ? (platform.error as Error).message
        : null;

  return (
    <footer className={styles.bar} aria-label="Local service status">
      <span className={styles.base}>{getApiBaseUrl()}</span>
      <span className={styles.status}>{apiLabel}</span>
      {detail ? <span className={styles.detail}>{detail}</span> : null}
      {forecastHint ? <span className={styles.detail}>{forecastHint}</span> : null}
      {launchLine ? (
        <span
          className={`${styles.launchLine} ${
            launchVariant === "error" ? styles.launchLineError : styles.launchLineSuccess
          }`}
          role="status"
        >
          {launchLine}
        </span>
      ) : null}
    </footer>
  );
}
