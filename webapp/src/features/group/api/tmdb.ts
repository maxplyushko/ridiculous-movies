import { apiFetch } from "@/api/client";
import type { TmdbMediaType, TmdbMovie, TmdbMovieDetails } from "@/types/TmdbMovie";
import type { TmdbActor } from "@/types/TmdbActor";
import type { TmdbPerson } from "@/types/TmdbPerson";
import { getTmdbLang } from "@/utils/tmdbLang.ts";

export function searchTmdb(query: string, signal?: AbortSignal, includeTv = false): Promise<TmdbMovie[]> {
  return apiFetch<TmdbMovie[]>(
    `/api/tmdb/search?q=${encodeURIComponent(query)}&lang=${getTmdbLang()}&includeTv=${includeTv}`,
    { signal }
  );
}

export function searchTmdbPeople(query: string, signal?: AbortSignal): Promise<TmdbPerson[]> {
  return apiFetch<TmdbPerson[]>(
    `/api/tmdb/search/person?q=${encodeURIComponent(query)}&lang=${getTmdbLang()}`,
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

export function fetchTmdbActor(personId: number, signal?: AbortSignal): Promise<TmdbActor> {
  return apiFetch<TmdbActor>(
    `/api/tmdb/actor/${personId}?lang=${getTmdbLang()}`,
    { signal }
  );
}
