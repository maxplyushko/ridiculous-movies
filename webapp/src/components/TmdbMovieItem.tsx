import { Bookmark, Calendar, Star } from "lucide-react";
import type { TmdbMovie } from "../types/TmdbMovie";
import { hapticTabTap } from "../haptics.ts";
import { useSwipeGesture } from "../hooks/useSwipeGesture.ts";

type TmdbMovieItemProps = {
  movie: TmdbMovie;
  isExpanded: boolean;
  isSwipeOpen: boolean;
  onToggle: () => void;
  onSwipeOpen: () => void;
  onSwipeClose: () => void;
  onSwipeBegin: () => void;
  onAddToWatchlist?: () => void;
};

const ACTIONS_WIDTH = 56;
const OPEN_THRESHOLD = 48;

const TmdbMovieItem = ({
  movie,
  isExpanded,
  isSwipeOpen,
  onToggle,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
  onAddToWatchlist,
}: TmdbMovieItemProps) => {
  const swipeable = !!onAddToWatchlist;
  const {
    offsetX,
    isDragging,
    isRevealed,
    showActions,
    closeSwipe,
    handleTransitionEnd,
    suppressNextClickRef,
    touchHandlers,
  } = useSwipeGesture({
    actionsWidth: swipeable ? ACTIONS_WIDTH : 0,
    openThreshold: swipeable ? OPEN_THRESHOLD : 999,
    isOpen: isSwipeOpen,
    onOpen: onSwipeOpen,
    onClose: onSwipeClose,
    onBegin: onSwipeBegin,
  });

  const handleClick = () => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (isRevealed) {
      closeSwipe();
      return;
    }
    hapticTabTap();
    onToggle();
  };

  return (
    <div
      className={`movie-item-wrapper${showActions && swipeable ? " movie-item-wrapper--actions-visible" : ""}`}
      style={{ "--actions-width": `${ACTIONS_WIDTH}px` } as React.CSSProperties}
    >
      {swipeable && (
        <div className="movie-item-management">
          <button
            type="button"
            className="movie-item-management__watchlist"
            onClick={() => { closeSwipe(); hapticTabTap(); onAddToWatchlist!(); }}
          >
            <Bookmark size={16} />
          </button>
        </div>
      )}
      <button
        type="button"
        className={`tmdb-movie-item${isExpanded ? " tmdb-movie-item--expanded" : ""}`}
        onClick={handleClick}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onTransitionEnd={(e) => { handleTransitionEnd(e.propertyName); }}
        {...touchHandlers}
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
    </div>
  );
};

export default TmdbMovieItem;
