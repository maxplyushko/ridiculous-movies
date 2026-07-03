import { apiFetch } from "@/api/client";
import type { TmdbMediaType, TmdbMovie, TmdbMovieDetails } from "@/types/TmdbMovie";
import { getTmdbLang } from "@/utils/tmdbLang.ts";

export function searchTmdb(query: string, signal?: AbortSignal, includeTv = false): Promise<TmdbMovie[]> {
  return apiFetch<TmdbMovie[]>(
    `/api/tmdb/search?q=${encodeURIComponent(query)}&lang=${getTmdbLang()}&includeTv=${includeTv}`,
    { signal }
  );
}

export function fetchTmdbMovieDetails(
  tmdbId: number,
  mediaType: TmdbMediaType = "movie",
  signal?: AbortSignal
): Promise<TmdbMovieDetails> {
  return apiFetch<TmdbMovieDetails>(
    `/api/tmdb/movie/${tmdbId}?lang=${getTmdbLang()}&mediaType=${mediaType}`,
    { signal }
  );
}
