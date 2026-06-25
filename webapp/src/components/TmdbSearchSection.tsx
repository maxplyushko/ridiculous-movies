import { useState } from "react";
import { Loader } from "lucide-react";
import type { TmdbMovie } from "../types/TmdbMovie.ts";
import { useTmdbSearch } from "../hooks/useTmdbSearch.ts";
import TmdbMovieItem from "./TmdbMovieItem.tsx";

type TmdbSearchSectionProps = {
  query: string;
  onAddToWatchlist: (movie: TmdbMovie) => void;
};

const TmdbSearchSection = ({ query, onAddToWatchlist }: TmdbSearchSectionProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);

  const { results, loading } = useTmdbSearch(query);

  if (query.trim().length < 3) return null;

  return (
    <div className="tmdb-section">
      <div className="movie-group__header">
        <h3>On TMDB</h3>
        {loading && <Loader size={14} className="tmdb-section__spinner" />}
      </div>
      {!loading && results.length === 0 && (
        <p className="movie-list__no-results">No TMDB results</p>
      )}
      {results.map((m) => (
        <TmdbMovieItem
          key={m.id}
          movie={m}
          isExpanded={expandedId === m.id}
          isSwipeOpen={openSwipeId === m.id}
          onToggle={() => { setOpenSwipeId(null); setExpandedId(expandedId === m.id ? null : m.id); }}
          onSwipeOpen={() => setOpenSwipeId(m.id)}
          onSwipeClose={() => setOpenSwipeId((cur) => cur === m.id ? null : cur)}
          onSwipeBegin={() => { if (openSwipeId !== null && openSwipeId !== m.id) setOpenSwipeId(null); }}
          onAddToWatchlist={() => onAddToWatchlist(m)}
        />
      ))}
    </div>
  );
};

export default TmdbSearchSection;
