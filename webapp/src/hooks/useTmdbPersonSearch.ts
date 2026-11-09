import { useCallback } from "react";
import type { TmdbPerson } from "../types/TmdbPerson";
import { searchTmdbPeople } from "@/features/group/api/tmdb";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch.ts";

const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_MIN_LEN = 3;

export function useTmdbPersonSearch(
  query: string,
  { minLen = DEFAULT_MIN_LEN, debounceMs = DEFAULT_DEBOUNCE_MS } = {}
) {
  const search = useCallback((trimmed: string, signal: AbortSignal) => searchTmdbPeople(trimmed, signal), []);
  return useDebouncedSearch<TmdbPerson>(query, search, { minLen, debounceMs });
}
