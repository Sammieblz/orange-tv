import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/api/client.ts";
import type { WeatherForecastDto } from "@/api/types.ts";

/** Smoke-test query against the template API endpoint. */
export function useWeatherForecast() {
  return useQuery({
    queryKey: ["api", "weatherforecast"],
    queryFn: () => fetchJson<WeatherForecastDto[]>("/weatherforecast"),
    staleTime: 30_000,
    retry: 1,
  });
}
