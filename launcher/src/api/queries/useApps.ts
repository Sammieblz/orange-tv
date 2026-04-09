import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/api/client.ts";
import type { AppsListDto } from "@/api/types.ts";

export function useApps() {
  return useQuery({
    queryKey: ["api", "apps"],
    queryFn: () => fetchJson<AppsListDto>("/api/v1/apps"),
    staleTime: 15_000,
    retry: 1,
  });
}
