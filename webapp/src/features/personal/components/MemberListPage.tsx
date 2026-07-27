import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../personal.css";
import type { PersonalMovie } from "../types/PersonalMovie.ts";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import { PersonalSection } from "./PersonalSection.tsx";
import { MoviePage } from "@/components/MoviePage.tsx";
import { ActorPage } from "@/components/ActorPage.tsx";
import { fetchPersonalListForUser } from "../api/personalList.ts";
import { MovieListSkeleton } from "@/components/MovieListSkeleton.tsx";
import { ErrorScreen } from "@/components/ErrorScreen.tsx";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { useDetailStack } from "@/hooks/useDetailStack.ts";

type Props = {
  targetUserId: string;
  targetName: string;
  onBack: () => void;
};

type DetailEntry =
  | { kind: "personal"; movieId: string }
  | { kind: "tmdb"; movie: TmdbMovie }
  | { kind: "actor"; personId: number };

const noop = () => {};

const MemberListPage = ({ targetUserId, targetName, onBack }: Readonly<Props>) => {
  const { t } = useTranslation();
  const [movies, setMovies] = useState<PersonalMovie[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const detailStack = useDetailStack<DetailEntry>();

  const loadMovies = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchPersonalListForUser(targetUserId)
      .then(setMovies)
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [targetUserId]);

  useEffect(() => {
    queueMicrotask(loadMovies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  const toWatch = movies.filter((m) => m.inList && !m.watched);
  const watched = movies.filter((m) => m.watched);

  return (
    <div className="mlp">
      <PageBackButton onBack={onBack} />
      <h2 className="page-title">{t('userPage.viewingMember', { name: targetName })}</h2>

      {isLoading && <MovieListSkeleton />}
      {!isLoading && error && <ErrorScreen error={error} />}
      {!isLoading && !error && (
        <div className="movie-list">
          <PersonalSection
            title={t('personalList.sectionToWatch')}
            movies={toWatch}
            openSwipeId={null}
            celebratingId={null}
            readOnly
            onOpen={(movie) => detailStack.push({ kind: "personal", movieId: movie.id })}
            onEdit={noop}
            onDelete={noop}
            onToggleWatched={noop}
            onSwipeOpen={noop}
            onSwipeClose={noop}
            onSwipeBegin={noop}
          />
          <PersonalSection
            title={t('personalList.sectionWatched')}
            movies={watched}
            openSwipeId={null}
            celebratingId={null}
            readOnly
            onOpen={(movie) => detailStack.push({ kind: "personal", movieId: movie.id })}
            onEdit={noop}
            onDelete={noop}
            onToggleWatched={noop}
            onSwipeOpen={noop}
            onSwipeClose={noop}
            onSwipeBegin={noop}
          />
          {movies.length === 0 && (
            <p className="movie-list__no-results">{t('userPage.memberEmpty')}</p>
          )}
        </div>
      )}

      {detailStack.stack.map((entry, i) => {
        const isTop = i === detailStack.stack.length - 1;
        const ref = isTop ? detailStack.setTopEl : undefined;
        if (entry.kind === "actor") {
          return (
            <div className="movie-list__add__movie" key={i} ref={ref}>
              <ActorPage
                personId={entry.personId}
                onBack={detailStack.pop}
                onOpenMovie={(m) => detailStack.push({ kind: "tmdb", movie: m })}
              />
            </div>
          );
        }
        if (entry.kind === "tmdb") {
          return (
            <div className="movie-list__add__movie" key={i} ref={ref}>
              <MoviePage
                source={{ kind: "tmdb", movie: entry.movie }}
                onBack={detailStack.pop}
                onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
              />
            </div>
          );
        }
        const movie = movies.find((m) => m.id === entry.movieId);
        if (!movie) return null;
        return (
          <div className="movie-list__add__movie" key={i} ref={ref}>
            <MoviePage
              source={{ kind: "personal", movie }}
              onBack={detailStack.pop}
              onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MemberListPage;
