import { useCallback } from "react";
import type { TmdbActor } from "@/types/TmdbActor";
import { fetchTmdbActor } from "@/features/group/api/tmdb";
import { getTmdbLang } from "@/utils/tmdbLang.ts";
import { useCachedRequest } from "@/hooks/useCachedRequest.ts";

const actorCache = new Map<string, TmdbActor>();

function cacheKey(personId: number): string {
  return `${personId}:${getTmdbLang()}`;
}

export function useTmdbActor(personId: number | undefined | null) {
  const key = personId == null ? null : cacheKey(personId);
  const fetchData = useCallback((signal: AbortSignal) => {
    if (personId == null) throw new Error("Actor details require a person id");
    return fetchTmdbActor(personId, signal);
  }, [personId]);
  const { data: actor, loading } = useCachedRequest(key, actorCache, fetchData);
  return { actor, loading };
}
