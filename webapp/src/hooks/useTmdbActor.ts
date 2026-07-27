import { useEffect, useState } from "react";
import type { TmdbActor } from "@/types/TmdbActor";
import { fetchTmdbActor } from "@/features/group/api/tmdb";
import { getTmdbLang } from "@/utils/tmdbLang.ts";

const actorCache = new Map<string, TmdbActor>();

function cacheKey(personId: number): string {
  return `${personId}:${getTmdbLang()}`;
}

export function useTmdbActor(personId: number | undefined | null) {
  const cached = personId != null ? actorCache.get(cacheKey(personId)) : undefined;
  const [actor, setActor] = useState<TmdbActor | null>(cached ?? null);
  const [loading, setLoading] = useState(personId != null && !cached);

  useEffect(() => {
    if (personId == null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActor(null);
      setLoading(false);
      return;
    }

    const key = cacheKey(personId);
    const hit = actorCache.get(key);
    if (hit) {
      setActor(hit);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchTmdbActor(personId, controller.signal)
      .then((data) => {
        actorCache.set(key, data);
        setActor(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setActor(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [personId]);

  return { actor, loading };
}
