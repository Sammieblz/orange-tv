import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/api/client.ts";
import type { HomeRecommendationsDto } from "@/api/types.ts";

export function useHomeRecommendations() {
  return useQuery({
    queryKey: ["api", "recommendations", "home"],
    queryFn: () => {
      const localHour = new Date().getHours();
      const q = new URLSearchParams({
        recentTake: "12",
        topAppsTake: "8",
        genreTake: "8",
        localHour: String(localHour),
      });
      return fetchJson<HomeRecommendationsDto>(`/api/v1/recommendations/home?${q.toString()}`);
    },
    staleTime: 60_000,
    retry: 1,
  });
}
