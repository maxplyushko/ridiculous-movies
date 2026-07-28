import { Bookmark, Calendar, Globe } from "lucide-react";
import type { TmdbMovie } from "@/types/TmdbMovie";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useSwipeGesture } from "@/hooks/useSwipeGesture.ts";

type TmdbMovieItemProps = {
  movie: TmdbMovie;
  isSwipeOpen: boolean;
  onOpen?: () => void;
  onSwipeOpen: () => void;
  onSwipeClose: () => void;
  onSwipeBegin: () => void;
  onAddToPersonalList?: () => void;
};

const ACTIONS_WIDTH = 56;
const OPEN_THRESHOLD = 48;

const TmdbMovieItem = ({
  movie,
  isSwipeOpen,
  onOpen,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
  onAddToPersonalList,
}: TmdbMovieItemProps) => {
  const swipeable = !!onAddToPersonalList;
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
    if (!onOpen) return;
    hapticTabTap();
    onOpen();
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
            className="movie-item-management__personal-list"
            onClick={() => { closeSwipe(); hapticTabTap(); onAddToPersonalList!(); }}
          >
            <Bookmark size={16} />
          </button>
        </div>
      )}
      <button
        type="button"
        className="tmdb-movie-item"
        onClick={handleClick}
        {...(swipeable ? {
          style: {
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          },
          onTransitionEnd: (e: React.TransitionEvent) => handleTransitionEnd(e.propertyName),
          ...touchHandlers,
        } : {})}
      >
        <div className="tmdb-movie-item__left">
          <span className="tmdb-movie-item__title">
            {movie.title}
            {movie.mediaType === "tv" && <span className="tmdb-movie-item__badge">TV</span>}
          </span>
          {movie.overview && (
            <span className="tmdb-movie-item__overview">{movie.overview}</span>
          )}
        </div>
        <div className="tmdb-movie-item__right">
          {movie.tmdbScore > 0 && (
            <span className="tmdb-movie-item__score">
              {movie.tmdbScore.toFixed(1)}<Globe size={14} />
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
