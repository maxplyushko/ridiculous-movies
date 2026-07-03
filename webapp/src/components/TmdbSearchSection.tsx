import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader } from "lucide-react";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import { useTmdbSearch } from "@/hooks/useTmdbSearch.ts";
import TmdbMovieItem from "./TmdbMovieItem.tsx";

type TmdbSearchSectionProps = {
  query: string;
  onOpenMovie?: (movie: TmdbMovie) => void;
  onAddToPersonalList?: (movie: TmdbMovie) => void;
};

const TmdbSearchSection = ({ query, onOpenMovie, onAddToPersonalList }: TmdbSearchSectionProps) => {
  const { t } = useTranslation();
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);

  const { results, loading } = useTmdbSearch(query, { includeTv: true });

  if (query.trim().length < 3) return null;

  return (
    <div className="tmdb-section">
      <div className="movie-group__header">
        <h3>{t('tmdb.section')}</h3>
        {loading && <Loader size={14} className="tmdb-section__spinner" />}
      </div>
      {!loading && results.length === 0 && (
        <p className="movie-list__no-results">{t('tmdb.empty')}</p>
      )}
      {results.map((m) => (
        <TmdbMovieItem
          key={m.id}
          movie={m}
          isSwipeOpen={openSwipeId === m.id}
          onOpen={onOpenMovie ? () => onOpenMovie(m) : undefined}
          onSwipeOpen={() => setOpenSwipeId(m.id)}
          onSwipeClose={() => setOpenSwipeId((cur) => cur === m.id ? null : cur)}
          onSwipeBegin={() => { if (openSwipeId !== null && openSwipeId !== m.id) setOpenSwipeId(null); }}
          onAddToPersonalList={onAddToPersonalList ? () => onAddToPersonalList(m) : undefined}
        />
      ))}
    </div>
  );
};

export default TmdbSearchSection;
