import type { WatchlistMovie } from "../types/WatchlistMovie";
import { Calendar, Check, Pencil, Star, Trash2 } from "lucide-react";
import { hapticTabTap } from "../haptics.ts";
import { useSwipeGesture } from "../hooks/useSwipeGesture.ts";

type WatchlistMovieItemProps = {
  movie: WatchlistMovie;
  isSwipeOpen: boolean;
  isCelebrating?: boolean;
  onEdit: (movie: WatchlistMovie) => void;
  onDelete: (movie: WatchlistMovie) => void;
  onToggleWatched: (movie: WatchlistMovie) => void;
  onSwipeOpen: () => void;
  onSwipeClose: () => void;
  onSwipeBegin: () => void;
};

const ACTIONS_WIDTH = 56;
const OPEN_THRESHOLD = 48;

const formatDate = (utc: string) =>
  new Date(utc).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const WatchlistMovieItem = ({
  movie,
  isSwipeOpen,
  isCelebrating,
  onEdit,
  onDelete,
  onToggleWatched,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: WatchlistMovieItemProps) => {
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
    actionsWidth: ACTIONS_WIDTH,
    openThreshold: OPEN_THRESHOLD,
    isOpen: isSwipeOpen,
    onOpen: onSwipeOpen,
    onClose: onSwipeClose,
    onBegin: onSwipeBegin,
  });

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (isRevealed) {
      closeSwipe();
      return;
    }
    hapticTabTap();
    onToggleWatched(movie);
  };

  return (
    <div
      className={`movie-item-wrapper${showActions ? " movie-item-wrapper--actions-visible" : ""}${movie.watched ? " watchlist-item--watched" : ""}`}
      style={{ "--actions-width": `${ACTIONS_WIDTH}px` } as React.CSSProperties}
    >
      <div className="movie-item-management">
        <button
          type="button"
          className="movie-item-management__edit"
          onClick={() => { closeSwipe(); onEdit(movie); }}
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="movie-item-management__delete"
          onClick={() => { closeSwipe(); onDelete(movie); }}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <article
        tabIndex={-1}
        className="movie-item"
        aria-label={movie.title}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onTransitionEnd={(e) => handleTransitionEnd(e.propertyName)}
        {...touchHandlers}
      >
        <div className="movie-item-header watchlist-item-header">
          <button
            type="button"
            className={`watchlist-item__checkbox${movie.watched ? " watchlist-item__checkbox--checked" : ""}${isCelebrating ? " watchlist-item__checkbox--pop" : ""}`}
            onClick={handleCheckboxClick}
            aria-label={movie.watched ? "Mark as unwatched" : "Mark as watched"}
          >
            {movie.watched && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="movie-item-header__left">
            <span className={`movie-item-header__title${movie.watched ? " watchlist-item__title--watched" : ""}`}>
              {movie.title}
            </span>
            {movie.description && (
              <span className="movie-item-header__desc">{movie.description}</span>
            )}
          </div>
          <div className="movie-item-header__right">
            <div className="movie-item-header__info">
              {movie.rating != null && (
                <span className="movie-item-header__info-item">
                  {movie.rating.toFixed(1)}<Star size={16} />
                </span>
              )}
              <span className="movie-item-header__info-item">
                {formatDate(movie.updatedAt)}<Calendar size={16} />
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default WatchlistMovieItem;
