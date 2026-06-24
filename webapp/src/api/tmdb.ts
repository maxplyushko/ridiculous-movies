import { apiFetch } from "./client";
import type { TmdbMovie } from "../types/TmdbMovie";

export function searchTmdb(query: string, signal?: AbortSignal): Promise<TmdbMovie[]> {
  return apiFetch<TmdbMovie[]>(`/api/tmdb/search?q=${encodeURIComponent(query)}`, { signal });
}
