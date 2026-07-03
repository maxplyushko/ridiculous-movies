import { useEffect, useState } from "react";
import type { TmdbMediaType, TmdbMovieDetails } from "@/types/TmdbMovie";
import { fetchTmdbMovieDetails } from "@/features/group/api/tmdb";

export function useTmdbMovieDetails(tmdbId: number | undefined | null, mediaType: TmdbMediaType = "movie") {
  const [details, setDetails] = useState<TmdbMovieDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tmdbId == null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetails(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchTmdbMovieDetails(tmdbId, mediaType, controller.signal)
      .then((data) => {
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
