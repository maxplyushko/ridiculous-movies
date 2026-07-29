import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "lucide-react";
import "../search.css";
import type { Movie } from "@/features/group/types/Movie.ts";
import type { PersonalMovie } from "@/features/personal/types/PersonalMovie.ts";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import { SearchInput } from "@/components/SearchInput.tsx";
import SearchMovieItem from "./SearchMovieItem.tsx";
import RecentSearchItem from "./RecentSearchItem.tsx";
import TmdbPeopleSection from "@/components/TmdbPeopleSection.tsx";
import { MoviePage } from "@/components/MoviePage.tsx";
import { ActorPage } from "@/components/ActorPage.tsx";
import { RatingModal } from "@/components/RatingModal.tsx";
import { Presence } from "@/components/Presence.tsx";
import { fetchMovieGroups, rateMovie } from "@/features/group/api/movies.ts";
import { editPersonalMovie, fetchPersonalList } from "@/features/personal/api/personalList.ts";
import { useDetailStack } from "@/hooks/useDetailStack.ts";
import { useTmdbSearch } from "@/hooks/useTmdbSearch.ts";
import { useTmdbPersonSearch } from "@/hooks/useTmdbPersonSearch.ts";
import { useRecentSearches } from "@/hooks/useRecentSearches.ts";
import type { RecentEntry } from "@/hooks/useRecentSearches.ts";
import { useCloseSwipeOnOutsideTap } from "@/hooks/useCloseSwipeOnOutsideTap.ts";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset.ts";
import { hapticTabTap } from "@/utils/haptics.ts";

type DetailEntry =
  | { kind: "group"; movieId: string }
  | { kind: "personal"; movieId: string }
  | { kind: "tmdb"; movie: TmdbMovie }
  | { kind: "actor"; personId: number };

type Filter = "all" | "app" | "internet" | "people";

type SearchResultsProps = {
  active: boolean;
  currentUserId: string;
  resetSignal?: number;
};

const SearchResults = ({ active, currentUserId, resetSignal }: Readonly<SearchResultsProps>) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [groupMovies, setGroupMovies] = useState<Movie[]>([]);
  const [personalMovies, setPersonalMovies] = useState<PersonalMovie[]>([]);
  const [ratingGroupMovie, setRatingGroupMovie] = useState<Movie | null>(null);
  const [ratingPersonalMovie, setRatingPersonalMovie] = useState<PersonalMovie | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const detailStack = useDetailStack<DetailEntry>();
  const { recent, addRecent, removeRecent } = useRecentSearches(currentUserId);
  const dockVisible = detailStack.stack.length === 0;
  const keyboardOffset = useKeyboardOffset(active && dockVisible);

  useCloseSwipeOnOutsideTap(openSwipeId, () => setOpenSwipeId(null));

  useEffect(() => {
    detailStack.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery("");
    setFilter("all");
  }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (active) {
      loadGroupMovies();
      loadPersonalMovies();
    }
  }, [active, loadGroupMovies, loadPersonalMovies]);

  const normalizedQuery = query.toLowerCase().trim();
  const matches = (title: string, description: string) =>
    title.toLowerCase().includes(normalizedQuery) || description.toLowerCase().includes(normalizedQuery);

  const showApp = filter === "all" || filter === "app";
  const showInternet = filter === "all" || filter === "internet";
  const showPeople = filter === "all" || filter === "people";

  const groupMatches = normalizedQuery && showApp ? groupMovies.filter((m) => matches(m.title, m.description)) : [];
  const personalMatches = normalizedQuery && showApp ? personalMovies.filter((m) => matches(m.title, m.description)) : [];

  const tmdbQuery = showInternet ? query : "";
  const { results: tmdbResults, loading: tmdbLoading } = useTmdbSearch(tmdbQuery, { includeTv: true });
  const showTmdb = showInternet && normalizedQuery.length >= 3
    && (filter !== "all" || tmdbLoading || tmdbResults.length > 0);

  const peopleQuery = showPeople ? query : "";
  const { results: peopleResults, loading: peopleLoading } = useTmdbPersonSearch(peopleQuery);
  const showPeopleSection = showPeople && normalizedQuery.length >= 3
    && (filter !== "all" || peopleLoading || peopleResults.length > 0);

  const openRecent = (entry: RecentEntry) => {
    if (entry.kind === "query") {
      setQuery(entry.label);
      return;
    }
    addRecent(entry);
    if (entry.kind === "actor") {
      detailStack.push({ kind: "actor", personId: entry.personId });
    } else if (entry.kind === "tmdb") {
      detailStack.push({ kind: "tmdb", movie: entry.movie });
    } else {
      detailStack.push({ kind: entry.kind, movieId: entry.movieId });
    }
  };

  const openGroupMovie = (movie: Movie) => {
    addRecent({ kind: "group", label: movie.title, movieId: movie.id });
    detailStack.push({ kind: "group", movieId: movie.id });
  };

  const openPersonalMovie = (movie: PersonalMovie) => {
    addRecent({ kind: "personal", label: movie.title, movieId: movie.id });
    detailStack.push({ kind: "personal", movieId: movie.id });
  };

  const openTmdbMovie = (movie: TmdbMovie) => {
    addRecent({ kind: "tmdb", label: movie.title, movie });
    detailStack.push({ kind: "tmdb", movie });
  };

  const noResults = normalizedQuery.length > 0
    && groupMatches.length === 0
    && personalMatches.length === 0
    && (!showTmdb || (!tmdbLoading && tmdbResults.length === 0))
    && (!showPeopleSection || (!peopleLoading && peopleResults.length === 0));

  return (
    <div className="mlp search-results">
      <div className="movie-list">
        {!normalizedQuery && recent.length === 0 && (
          <p className="movie-list__no-results">{t('search.emptyStart')}</p>
        )}

        {!normalizedQuery && recent.length > 0 && (
          <div className="movie-group">
            <div className="movie-group__header"><h3>{t('search.recentTitle')}</h3></div>
            {recent.map((entry) => (
              <RecentSearchItem
                key={entry.label}
                entry={entry}
                isSwipeOpen={openSwipeId === entry.label}
                onOpen={openRecent}
                onDelete={removeRecent}
                onSwipeOpen={() => setOpenSwipeId(entry.label)}
                onSwipeClose={() => setOpenSwipeId((cur) => cur === entry.label ? null : cur)}
                onSwipeBegin={() => { if (openSwipeId !== null && openSwipeId !== entry.label) setOpenSwipeId(null); }}
              />
            ))}
          </div>
        )}

        {noResults && (
          <p className="movie-list__no-results">{t('search.noResults')} "{query}"</p>
        )}

        {groupMatches.length > 0 && (
          <div className="movie-group">
            <div className="movie-group__header"><h3>{t('search.sectionClub')}</h3></div>
            {groupMatches.map((movie) => (
              <SearchMovieItem
                key={movie.id}
                title={movie.title}
                tmdbId={movie.tmdbId}
                tmdbMediaType={movie.tmdbMediaType}
                onOpen={() => openGroupMovie(movie)}
              />
            ))}
          </div>
        )}

        {personalMatches.length > 0 && (
          <div className="movie-group">
            <div className="movie-group__header"><h3>{t('search.sectionPersonal')}</h3></div>
            {personalMatches.map((movie) => (
              <SearchMovieItem
                key={movie.id}
                title={movie.title}
                tmdbId={movie.tmdbId}
                tmdbMediaType={movie.tmdbMediaType}
                onOpen={() => openPersonalMovie(movie)}
              />
            ))}
          </div>
        )}

        {showTmdb && (
          <div className="tmdb-section">
            <div className="movie-group__header">
              <h3>{t('tmdb.section')}</h3>
              {tmdbLoading && <Loader size={14} className="tmdb-section__spinner" />}
            </div>
            {filter !== "all" && !tmdbLoading && tmdbResults.length === 0 && (
              <p className="movie-list__no-results">{t('tmdb.empty')}</p>
            )}
            {tmdbResults.map((movie) => (
              <SearchMovieItem
                key={movie.id}
                title={movie.title}
                year={movie.releaseYear}
                posterUrl={movie.posterUrl}
                onOpen={() => openTmdbMovie(movie)}
              />
            ))}
          </div>
        )}

        {showPeopleSection && (
          <TmdbPeopleSection
            results={peopleResults}
            loading={peopleLoading}
            showEmptyMessage={filter !== "all" && !peopleLoading && peopleResults.length === 0}
            onOpenPerson={(p) => { addRecent({ kind: "actor", label: p.name, personId: p.id }); detailStack.push({ kind: "actor", personId: p.id }); }}
          />
        )}
      </div>

      {dockVisible && (
        <div
          className="search-bottom-bar"
          style={keyboardOffset > 0 ? { bottom: `${keyboardOffset}px` } : undefined}
        >
          <div className="user-chip-row">
            {([
              ["all", t('search.filterAll')],
              ["app", t('search.filterApp')],
              ["internet", t('search.filterInternet')],
              ["people", t('search.filterPeople')],
            ] as Array<[Filter, string]>).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`user-chip${filter === id ? " user-chip--selected" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { hapticTabTap(); setFilter(id); }}
              >
                {label}
              </button>
            ))}
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t('search.placeholder')}
            cancelLabel={t('search.cancel')}
          />
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
    </div>
  );
};

export default SearchResults;
