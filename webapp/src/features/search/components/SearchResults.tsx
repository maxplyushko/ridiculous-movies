import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "lucide-react";
import "../search.css";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import { ListSearchBar } from "@/components/ListSearchBar.tsx";
import SearchMovieItem from "./SearchMovieItem.tsx";
import RecentSearchItem from "./RecentSearchItem.tsx";
import TmdbPeopleSection from "@/components/TmdbPeopleSection.tsx";
import { MoviePage } from "@/components/MoviePage.tsx";
import { ActorPage } from "@/components/ActorPage.tsx";
import { useDetailStack } from "@/hooks/useDetailStack.ts";
import { useTmdbSearch } from "@/hooks/useTmdbSearch.ts";
import { useTmdbPersonSearch } from "@/hooks/useTmdbPersonSearch.ts";
import { useRecentSearches } from "@/hooks/useRecentSearches.ts";
import type { RecentEntry } from "@/hooks/useRecentSearches.ts";
import { useCloseSwipeOnOutsideTap } from "@/hooks/useCloseSwipeOnOutsideTap.ts";

type DetailEntry =
  | { kind: "tmdb"; movie: TmdbMovie }
  | { kind: "actor"; personId: number };

type SearchResultsProps = {
  currentUserId: string;
  resetSignal?: number;
};

const SearchResults = ({ currentUserId, resetSignal }: Readonly<SearchResultsProps>) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const detailStack = useDetailStack<DetailEntry>();
  const { recent, addRecent, removeRecent } = useRecentSearches(currentUserId);

  useCloseSwipeOnOutsideTap(openSwipeId, () => setOpenSwipeId(null));

  useEffect(() => {
    detailStack.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery("");
  }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizedQuery = query.toLowerCase().trim();

  const { results: tmdbResults, loading: tmdbLoading } = useTmdbSearch(query, { includeTv: true });
  const showTmdb = normalizedQuery.length >= 3 && (tmdbLoading || tmdbResults.length > 0);

  const { results: peopleResults, loading: peopleLoading } = useTmdbPersonSearch(query);
  const showPeopleSection = normalizedQuery.length >= 3 && (peopleLoading || peopleResults.length > 0);

  const openRecent = (entry: RecentEntry) => {
    if (entry.kind === "query") {
      setQuery(entry.label);
      return;
    }
    addRecent(entry);
    if (entry.kind === "actor") {
      detailStack.push({ kind: "actor", personId: entry.personId });
    } else {
      detailStack.push({ kind: "tmdb", movie: entry.movie });
    }
  };

  const openTmdbMovie = (movie: TmdbMovie) => {
    addRecent({ kind: "tmdb", label: movie.title, movie });
    detailStack.push({ kind: "tmdb", movie });
  };

  const noResults = normalizedQuery.length > 0
    && (!showTmdb || (!tmdbLoading && tmdbResults.length === 0))
    && (!showPeopleSection || (!peopleLoading && peopleResults.length === 0));

  return (
    <div className="mlp search-results">
      <ListSearchBar value={query} onChange={setQuery} placeholder={t('search.placeholder')} />

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

        {showTmdb && (
          <div className="tmdb-section">
            <div className="movie-group__header">
              <h3>{t('tmdb.section')}</h3>
              {tmdbLoading && <Loader size={14} className="tmdb-section__spinner" />}
            </div>
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
            showEmptyMessage={false}
            onOpenPerson={(p) => { addRecent({ kind: "actor", label: p.name, personId: p.id }); detailStack.push({ kind: "actor", personId: p.id }); }}
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
        return (
          <div className="movie-list__add__movie" key={i} ref={ref}>
            <MoviePage
              source={{ kind: "tmdb", movie: entry.movie }}
              onBack={detailStack.pop}
              onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
            />
          </div>
        );
      })}
    </div>
  );
};

export default SearchResults;
