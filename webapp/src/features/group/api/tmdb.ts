import { apiFetch } from "@/api/client";
import type { TmdbMovie } from "@/types/TmdbMovie";
import { getTmdbLang } from "@/utils/tmdbLang.ts";

export function searchTmdb(query: string, signal?: AbortSignal): Promise<TmdbMovie[]> {
  return apiFetch<TmdbMovie[]>(`/api/tmdb/search?q=${encodeURIComponent(query)}&lang=${getTmdbLang()}`, { signal });
}
