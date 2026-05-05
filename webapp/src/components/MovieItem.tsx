import type { Movie } from "../types/Movie";
import { Star, User, Calendar } from "lucide-react";

type MovieItemProps = {
  movie: Movie;
  isExpanded: boolean;
  onToggle: () => void;
};

const formatDate = (utc: string) =>
  new Date(utc).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const MovieItem = ({ movie, isExpanded, onToggle }: MovieItemProps) => {
  return (
    <div
      className="movie-item"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget) && isExpanded) {
          onToggle();
        }
      }}
    >
      <button className="movie-item-header" onClick={onToggle}>
        <div className="movie-item-header__left">
          <span className="movie-item-header__title">{movie.title}</span>
          <span className="movie-item-header__desc">{movie.description}</span>
        </div>
        <div className="movie-item-header__right">
          <div className="movie-item-header__info">
            <span className="movie-item-header__info-item">{(movie.averageRating ?? 0).toFixed(1)} <Star size={16} /> </span>
            <span className="movie-item-header__info-item">{movie.owner.name} <User size={16} /></span>
            <span className="movie-item-header__info-item">{formatDate(movie.createdAt)} <Calendar size={16} /></span>
          </div>
        </div>
      </button>
      <div className={`movie-item-details ${isExpanded ? "open" : ""}`} tabIndex={-1}>
        <div className="movie-item-details__ratings">
          {[...movie.ratings].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map(r => (
            <span key={r.id} className="movie-item-details__rating-item">
              <User size={16} /> {r.user.name}: {r.score.toFixed(1)}
            </span>))}
        </div>
      </div>
    </div>
  )

}

export default MovieItem;