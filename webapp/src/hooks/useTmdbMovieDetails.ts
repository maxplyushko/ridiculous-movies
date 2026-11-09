import { useCallback } from "react";
import type { TmdbMediaType, TmdbMovieDetails } from "@/types/TmdbMovie";
import { fetchTmdbMovieDetails } from "@/features/group/api/tmdb";
import { getTmdbLang } from "@/utils/tmdbLang.ts";
import { useCachedRequest } from "@/hooks/useCachedRequest.ts";

const detailsCache = new Map<string, TmdbMovieDetails>();

function cacheKey(tmdbId: number, mediaType: TmdbMediaType): string {
  return `${tmdbId}:${mediaType}:${getTmdbLang()}`;
}

export function useTmdbMovieDetails(tmdbId: number | undefined | null, mediaType: TmdbMediaType = "movie") {
  const key = tmdbId == null ? null : cacheKey(tmdbId, mediaType);
  const fetchData = useCallback((signal: AbortSignal) => {
    if (tmdbId == null) throw new Error("Movie details require a TMDB id");
    return fetchTmdbMovieDetails(tmdbId, mediaType, signal);
  }, [tmdbId, mediaType]);
  const { data: details, loading } = useCachedRequest(key, detailsCache, fetchData);
  return { details, loading };
}
