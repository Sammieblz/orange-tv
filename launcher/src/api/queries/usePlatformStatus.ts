import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/api/client.ts";
import type { PlatformStatusDto } from "@/api/types.ts";

export function usePlatformStatus() {
  return useQuery({
    queryKey: ["api", "platform"],
    queryFn: () => fetchJson<PlatformStatusDto>("/api/v1/system/platform"),
    staleTime: 60_000,
    retry: 1,
  });
}
