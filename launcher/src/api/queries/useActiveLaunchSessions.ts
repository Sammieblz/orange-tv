import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/api/client.ts";
import type { ActiveLaunchSessionsDto } from "@/api/types.ts";

export function useActiveLaunchSessions() {
  return useQuery({
    queryKey: ["api", "launch", "sessions", "active"],
    queryFn: () => fetchJson<ActiveLaunchSessionsDto>("/api/v1/launch/sessions/active"),
    staleTime: 2000,
    // Avoid background refetch in Vitest (would keep failed queries in a perpetual fetching state for UI tests).
    refetchInterval: import.meta.env.MODE === "test" ? false : 3000,
    retry: 1,
  });
}
