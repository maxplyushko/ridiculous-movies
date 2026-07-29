import { Calendar } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useTmdbMovieDetails } from "@/hooks/useTmdbMovieDetails.ts";
import type { TmdbMediaType } from "@/types/TmdbMovie.ts";
import noPosterFallback from "@/assets/no-poster.png";

type SearchMovieItemProps = {
  title: string;
  year?: string;
  posterUrl?: string | null;
  tmdbId?: number;
  tmdbMediaType?: TmdbMediaType;
  onOpen: () => void;
};

const SearchMovieItem = ({ title, year, posterUrl, tmdbId, tmdbMediaType, onOpen }: Readonly<SearchMovieItemProps>) => {
  const lookupId = posterUrl === undefined ? (tmdbId ?? null) : null;
  const { details } = useTmdbMovieDetails(lookupId, tmdbMediaType ?? "movie");
  const resolvedPosterUrl = posterUrl !== undefined ? posterUrl : (details?.posterUrl ?? null);

  return (
    <div className="movie-item-wrapper">
      <article tabIndex={-1} className="movie-item" aria-label={title}>
        <button
          type="button"
          className="movie-item-header"
          onClick={() => { hapticTabTap(); onOpen(); }}
        >
          <div className="movie-item-header__poster">
            <img src={resolvedPosterUrl ?? noPosterFallback} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="movie-item-header__left">
            <span className="movie-item-header__title">{title}</span>
          </div>
          {year && (
            <div className="movie-item-header__right">
              <div className="movie-item-header__info">
                <span className="movie-item-header__info-item">{year}<Calendar size={16} /></span>
              </div>
            </div>
          )}
        </button>
      </article>
    </div>
  );
};

export default SearchMovieItem;
