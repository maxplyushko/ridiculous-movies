import type { ReactNode } from "react";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import { MoviePage } from "@/components/MoviePage.tsx";
import { ActorPage } from "@/components/ActorPage.tsx";

type SharedEntry =
  | { kind: "actor"; personId: number }
  | { kind: "tmdb"; movie: TmdbMovie };

type DetailStackEntriesProps<TLocal extends { kind: string; movieId: string }> = {
  stack: (TLocal | SharedEntry)[];
  setTopEl: (el: HTMLDivElement | null) => void;
  push: (entry: TLocal | SharedEntry) => void;
  pop: () => void;
  renderLocal: (entry: TLocal) => ReactNode;
};

export function DetailStackEntries<TLocal extends { kind: string; movieId: string }>({
  stack,
  setTopEl,
  push,
  pop,
  renderLocal,
}: Readonly<DetailStackEntriesProps<TLocal>>) {
  return (
    <>
      {stack.map((entry, i) => {
        const isTop = i === stack.length - 1;
        const ref = isTop ? setTopEl : undefined;

        if (entry.kind === "actor") {
          const { personId } = entry as Extract<SharedEntry, { kind: "actor" }>;
          return (
            <div className="movie-list__add__movie" key={`actor-${personId}`} ref={ref}>
              <ActorPage
                personId={personId}
                onBack={pop}
                onOpenMovie={(m) => push({ kind: "tmdb", movie: m })}
              />
            </div>
          );
        }
        if (entry.kind === "tmdb") {
          const { movie } = entry as Extract<SharedEntry, { kind: "tmdb" }>;
          return (
            <div className="movie-list__add__movie" key={`tmdb-${movie.id}`} ref={ref}>
              <MoviePage
                source={{ kind: "tmdb", movie }}
                onBack={pop}
                onOpenActor={(personId) => push({ kind: "actor", personId })}
              />
            </div>
          );
        }

        const local = entry as TLocal;
        const rendered = renderLocal(local);
        if (rendered === null) return null;
        return (
          <div className="movie-list__add__movie" key={`${local.kind}-${local.movieId}`} ref={ref}>
            {rendered}
          </div>
        );
      })}
    </>
  );
}
