import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../personal.css";
import type { PersonalMovie } from "../types/PersonalMovie.ts";
import { PersonalSection } from "./PersonalSection.tsx";
import { MoviePage } from "@/components/MoviePage.tsx";
import { fetchPersonalListForUser } from "../api/personalList.ts";
import { MovieListSkeleton } from "@/components/MovieListSkeleton.tsx";
import { ErrorScreen } from "@/components/ErrorScreen.tsx";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";

type Props = {
  targetUserId: string;
  targetName: string;
  onBack: () => void;
};

const noop = () => {};

const MemberListPage = ({ targetUserId, targetName, onBack }: Readonly<Props>) => {
  const { t } = useTranslation();
  const [movies, setMovies] = useState<PersonalMovie[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [viewingMovieId, setViewingMovieId] = useState<string | null>(null);
  const [movieViewEl, setMovieViewEl] = useState<HTMLDivElement | null>(null);

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

  const closeMovieView = () => setViewingMovieId(null);
  useSwipeBack(closeMovieView, movieViewEl);

  const viewingMovie = movies.find((m) => m.id === viewingMovieId) ?? null;
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
            onOpen={(movie) => setViewingMovieId(movie.id)}
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
            onOpen={(movie) => setViewingMovieId(movie.id)}
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

      {viewingMovie && (
        <div className="movie-list__add__movie" ref={setMovieViewEl}>
          <MoviePage
            source={{ kind: "personal", movie: viewingMovie }}
            onBack={closeMovieView}
          />
        </div>
      )}
    </div>
  );
};

export default MemberListPage;
