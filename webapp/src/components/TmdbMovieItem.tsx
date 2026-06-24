import { Calendar, Star } from "lucide-react";
import type { TmdbMovie } from "../types/TmdbMovie";
import { hapticTabTap } from "../haptics.ts";

type TmdbMovieItemProps = {
  movie: TmdbMovie;
  isExpanded: boolean;
  onToggle: () => void;
};

const TmdbMovieItem = ({ movie, isExpanded, onToggle }: TmdbMovieItemProps) => (
  <button
    type="button"
    className={`tmdb-movie-item${isExpanded ? " tmdb-movie-item--expanded" : ""}`}
    onClick={() => { hapticTabTap(); onToggle(); }}
  >
    <div className="tmdb-movie-item__left">
      <span className="tmdb-movie-item__title">{movie.title}</span>
      {movie.overview && (
        <span className="tmdb-movie-item__overview">{movie.overview}</span>
      )}
    </div>
    <div className="tmdb-movie-item__right">
      {movie.tmdbScore > 0 && (
        <span className="tmdb-movie-item__score">
          {movie.tmdbScore.toFixed(1)}<Star size={14} />
        </span>
      )}
      {movie.releaseYear && (
        <span className="tmdb-movie-item__year">{movie.releaseYear}<Calendar size={16} /></span>
      )}
    </div>
  </button>
);

export default TmdbMovieItem;
