import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "../search.css";
import type { Movie } from "@/features/group/types/Movie.ts";
import type { PersonalMovie } from "@/features/personal/types/PersonalMovie.ts";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import MovieItem from "@/features/group/components/MovieItem.tsx";
import { PersonalSection } from "@/features/personal/components/PersonalSection.tsx";
import TmdbSearchSection from "@/components/TmdbSearchSection.tsx";
import TmdbPeopleSection from "@/components/TmdbPeopleSection.tsx";
import { MoviePage } from "@/components/MoviePage.tsx";
import { ActorPage } from "@/components/ActorPage.tsx";
import { RatingModal } from "@/components/RatingModal.tsx";
import { GuestLimitModal } from "@/components/GuestLimitModal.tsx";
import { Presence } from "@/components/Presence.tsx";
import { fetchMovieGroups, rateMovie } from "@/features/group/api/movies.ts";
import { addPersonalMovie, editPersonalMovie, fetchPersonalList } from "@/features/personal/api/personalList.ts";
import { useDetailStack } from "@/hooks/useDetailStack.ts";

type DetailEntry =
  | { kind: "group"; movieId: string }
  | { kind: "personal"; movieId: string }
  | { kind: "tmdb"; movie: TmdbMovie }
  | { kind: "actor"; personId: number };

type SearchResultsProps = {
  query: string;
  active: boolean;
  currentUserId: string;
  resetSignal?: number;
  onDetailOpenChange: (open: boolean) => void;
};

const noop = () => {};

const SearchResults = ({ query, active, currentUserId, resetSignal, onDetailOpenChange }: Readonly<SearchResultsProps>) => {
  const { t } = useTranslation();
  const [groupMovies, setGroupMovies] = useState<Movie[]>([]);
  const [personalMovies, setPersonalMovies] = useState<PersonalMovie[]>([]);
  const [ratingGroupMovie, setRatingGroupMovie] = useState<Movie | null>(null);
  const [ratingPersonalMovie, setRatingPersonalMovie] = useState<PersonalMovie | null>(null);
  const [showGuestLimit, setShowGuestLimit] = useState(false);
  const detailStack = useDetailStack<DetailEntry>();

  useEffect(() => { detailStack.reset(); }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGroupMovies = useCallback(() => {
    fetchMovieGroups({ sort: "desc" })
      .then((data) => setGroupMovies(data.groups.flatMap((g) => g.movies)))
      .catch(() => {});
  }, []);

  const loadPersonalMovies = useCallback(() => {
    fetchPersonalList()
      .then(setPersonalMovies)
      .catch(() => {});
  }, []);

  const detailDepth = detailStack.stack.length;
  useEffect(() => { onDetailOpenChange(detailDepth > 0); }, [detailDepth, onDetailOpenChange]);

  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (active && !wasActiveRef.current) {
      loadGroupMovies();
      loadPersonalMovies();
    }
    wasActiveRef.current = active;
  }, [active, loadGroupMovies, loadPersonalMovies]);

  const bookmarkedTmdbIds = useMemo(
    () => new Set(personalMovies.filter((m) => m.inList && m.tmdbId != null).map((m) => m.tmdbId as number)),
    [personalMovies],
  );

  const normalizedQuery = query.toLowerCase().trim();
  const matches = (title: string, description: string) =>
    title.toLowerCase().includes(normalizedQuery) || description.toLowerCase().includes(normalizedQuery);

  const groupMatches = normalizedQuery ? groupMovies.filter((m) => matches(m.title, m.description)) : [];
  const personalMatches = normalizedQuery ? personalMovies.filter((m) => matches(m.title, m.description)) : [];
  const showTmdb = normalizedQuery.length >= 3;

  const addToPersonalList = (m: TmdbMovie) =>
    addPersonalMovie({ title: m.title, description: m.overview ?? "", tagline: "", rating: null, tmdbId: m.id, tmdbMediaType: m.mediaType })
      .then((added) => { setPersonalMovies((prev) => [added, ...prev]); })
      .catch((e) => { if (e instanceof Error && e.message === "GUEST_LIMIT_REACHED") setShowGuestLimit(true); });

  return (
    <div className="mlp search-results">
      <div className="movie-list">
        {normalizedQuery && groupMatches.length === 0 && personalMatches.length === 0 && !showTmdb && (
          <p className="movie-list__no-results">{t('search.noResults')} "{query}"</p>
        )}

        {groupMatches.length > 0 && (
          <div className="movie-group">
            <div className="movie-group__header"><h3>{t('search.sectionClub')}</h3></div>
            {groupMatches.map((movie) => (
              <MovieItem
                key={movie.id}
                movie={movie}
                isSwipeOpen={false}
                canDelete={false}
                readOnly
                onOpen={() => detailStack.push({ kind: "group", movieId: movie.id })}
                onEdit={noop}
                onDelete={noop}
                onSwipeOpen={noop}
                onSwipeClose={noop}
                onSwipeBegin={noop}
              />
            ))}
          </div>
        )}

        <PersonalSection
          title={t('search.sectionPersonal')}
          movies={personalMatches}
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

        {showTmdb && (
          <TmdbSearchSection
            query={query}
            onOpenMovie={(m) => detailStack.push({ kind: "tmdb", movie: m })}
            onAddToPersonalList={addToPersonalList}
            bookmarkedTmdbIds={bookmarkedTmdbIds}
          />
        )}
        {showTmdb && (
          <TmdbPeopleSection
            query={query}
            onOpenPerson={(p) => detailStack.push({ kind: "actor", personId: p.id })}
          />
        )}
      </div>

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
                onPersonalStateChange={loadPersonalMovies}
                onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
              />
            </div>
          );
        }
        if (entry.kind === "personal") {
          const movie = personalMovies.find((m) => m.id === entry.movieId);
          if (!movie) return null;
          return (
            <div className="movie-list__add__movie" key={i} ref={ref}>
              <MoviePage
                source={{ kind: "personal", movie }}
                onBack={detailStack.pop}
                onRate={() => setRatingPersonalMovie(movie)}
                onPersonalStateChange={loadPersonalMovies}
                onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
              />
            </div>
          );
        }
        const movie = groupMovies.find((m) => m.id === entry.movieId);
        if (!movie) return null;
        return (
          <div className="movie-list__add__movie" key={i} ref={ref}>
            <MoviePage
              source={{ kind: "group", movie }}
              currentUserId={currentUserId}
              onBack={detailStack.pop}
              onRate={() => setRatingGroupMovie(movie)}
              onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
            />
          </div>
        );
      })}

      <Presence show={ratingGroupMovie !== null}>
        {ratingGroupMovie && (
          <RatingModal
            title={ratingGroupMovie.title}
            cancelLabel={t('groupList.btnCancel')}
            saveLabel={t('personalList.btnSave')}
            onCancel={() => setRatingGroupMovie(null)}
            onSave={async (score) => {
              await rateMovie(ratingGroupMovie.id, score);
              setRatingGroupMovie(null);
              loadGroupMovies();
            }}
          />
        )}
      </Presence>

      <Presence show={ratingPersonalMovie !== null}>
        {ratingPersonalMovie && (
          <RatingModal
            title={t('personalList.rateDialog', { title: ratingPersonalMovie.title })}
            initialScore={ratingPersonalMovie.rating}
            defaultMode="classic"
            cancelLabel={t('personalList.btnSkip')}
            saveLabel={t('personalList.btnSave')}
            onCancel={() => setRatingPersonalMovie(null)}
            onSave={async (rating) => {
              const movie = ratingPersonalMovie;
              setRatingPersonalMovie(null);
              const updated = await editPersonalMovie(movie.id, {
                title: movie.title,
                description: movie.description,
                tagline: movie.tagline,
                rating,
                watched: movie.watched,
                tmdbId: movie.tmdbId,
                tmdbMediaType: movie.tmdbMediaType,
              });
              setPersonalMovies((prev) => prev.map((m) => m.id === updated.id ? updated : m));
            }}
          />
        )}
      </Presence>

      <Presence show={showGuestLimit}>
        {showGuestLimit && <GuestLimitModal onClose={() => setShowGuestLimit(false)} />}
      </Presence>
    </div>
  );
};

export default SearchResults;
