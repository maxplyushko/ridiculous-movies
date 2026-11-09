import { useEffect, useState } from "react";
import type { Movie } from "@/features/group/types/Movie";
import { fetchGroupMembersWhoAdded } from "@/features/personal/api/personalList.ts";
import { fetchGroupMovieMatch } from "@/features/group/api/movies.ts";

export function useMovieGroupContext(tmdbId: number | null | undefined, title: string, isGroupMovie: boolean) {
  const [addedByMembers, setAddedByMembers] = useState<string[]>([]);
  const [groupMatch, setGroupMatch] = useState<Movie | null>(null);

  useEffect(() => {
    if (tmdbId == null && !title) return;
    let cancelled = false;
    fetchGroupMembersWhoAdded(tmdbId, title)
      .then((names) => { if (!cancelled) setAddedByMembers(names); })
      .catch(() => { if (!cancelled) setAddedByMembers([]); });
    return () => { cancelled = true; };
  }, [tmdbId, title]);

  useEffect(() => {
    if (isGroupMovie || (tmdbId == null && !title)) return;
    let cancelled = false;
    fetchGroupMovieMatch(tmdbId, title)
      .then((match) => { if (!cancelled) setGroupMatch(match); })
      .catch(() => { if (!cancelled) setGroupMatch(null); });
    return () => { cancelled = true; };
  }, [isGroupMovie, tmdbId, title]);

  return { addedByMembers, groupMatch };
}
