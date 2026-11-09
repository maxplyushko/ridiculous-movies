import { useCallback } from "react";
import type { TmdbMovie } from "../types/TmdbMovie";
import { searchTmdb } from "@/features/group/api/tmdb";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch.ts";

const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_MIN_LEN = 3;

export function useTmdbSearch(
  query: string,
  { minLen = DEFAULT_MIN_LEN, debounceMs = DEFAULT_DEBOUNCE_MS, includeTv = false } = {}
) {
  const search = useCallback((trimmed: string, signal: AbortSignal) => searchTmdb(trimmed, signal, includeTv), [includeTv]);
  return useDebouncedSearch<TmdbMovie>(query, search, { minLen, debounceMs });
}
