import { useEffect, useState } from "react";
import type { TmdbMediaType, TmdbMovieDetails } from "@/types/TmdbMovie";
import { fetchTmdbMovieDetails } from "@/features/group/api/tmdb";
import { getTmdbLang } from "@/utils/tmdbLang.ts";

const detailsCache = new Map<string, TmdbMovieDetails>();

function cacheKey(tmdbId: number, mediaType: TmdbMediaType): string {
  return `${tmdbId}:${mediaType}:${getTmdbLang()}`;
}

export function useTmdbMovieDetails(tmdbId: number | undefined | null, mediaType: TmdbMediaType = "movie") {
  const cached = tmdbId != null ? detailsCache.get(cacheKey(tmdbId, mediaType)) : undefined;
  const [details, setDetails] = useState<TmdbMovieDetails | null>(cached ?? null);
  const [loading, setLoading] = useState(tmdbId != null && !cached);

  useEffect(() => {
    if (tmdbId == null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetails(null);
      setLoading(false);
      return;
    }

    const key = cacheKey(tmdbId, mediaType);
    const hit = detailsCache.get(key);
    if (hit) {
      setDetails(hit);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchTmdbMovieDetails(tmdbId, mediaType, controller.signal)
      .then((data) => {
        detailsCache.set(key, data);
        setDetails(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setDetails(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [tmdbId, mediaType]);

  return { details, loading };
}
