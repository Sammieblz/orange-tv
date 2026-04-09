import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/api/client.ts";
import type { ContinueWatchingListDto } from "@/api/types.ts";

export function useContinueWatching() {
  return useQuery({
    queryKey: ["api", "watch", "continue"],
    queryFn: () => fetchJson<ContinueWatchingListDto>("/api/v1/watch/continue"),
    staleTime: 10_000,
    retry: 1,
  });
}
