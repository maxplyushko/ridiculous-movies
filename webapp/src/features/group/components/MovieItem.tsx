import type { Movie } from "../types/Movie";
import type { CSSProperties, MouseEvent } from "react";
import { Calendar, Pencil, Star, Trash2, User } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useSwipeGesture } from "@/hooks/useSwipeGesture.ts";

type MovieItemProps = {
  movie: Movie;
  isSwipeOpen: boolean;
  canDelete: boolean;
  readOnly?: boolean;
  onOpen: (movie: Movie) => void;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
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

const MovieItem = ({
  movie,
  isSwipeOpen,
  canDelete,
  readOnly = false,
  onOpen,
  onEdit,
  onDelete,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: MovieItemProps) => {
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

  const handleHeaderClick = (e: MouseEvent) => {
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
    onOpen(movie);
  };

  return (
    <div
      className={`movie-item-wrapper${showActions && !readOnly ? " movie-item-wrapper--actions-visible" : ""}`}
      style={{ "--actions-width": `${ACTIONS_WIDTH}px` } as CSSProperties}
    >
      {!readOnly && (
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
          disabled={!canDelete}
          onClick={() => { closeSwipe(); onDelete(movie); }}
        >
          <Trash2 size={16} />
        </button>
      </div>
      )}
      <article
        tabIndex={-1}
        className="movie-item"
        aria-label={movie.title}
        style={readOnly ? undefined : {
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onTransitionEnd={readOnly ? undefined : (e) => handleTransitionEnd(e.propertyName)}
        {...(readOnly ? {} : touchHandlers)}
      >
        <button
          type="button"
          className="movie-item-header"
          onClick={handleHeaderClick}
          onKeyDown={(e) => { if (e.key === "Escape" && isRevealed) closeSwipe(); }}
        >
          <div className="movie-item-header__left">
            <span className="movie-item-header__title">{movie.title}</span>
            {movie.tagline && (
              <span className="movie-item-header__desc">{movie.tagline}</span>
            )}
          </div>
          <div className="movie-item-header__right">
            <div className="movie-item-header__info">
              <span className="movie-item-header__info-item">
                {(movie.averageRating ?? 0).toFixed(1)}<Star size={16} />
              </span>
              <span className="movie-item-header__info-item">{movie.owner.name} <User size={16} /></span>
              <span className="movie-item-header__info-item">{formatDate(movie.createdAt)}<Calendar size={16} /></span>
            </div>
          </div>
        </button>
      </article>
    </div>
  );
};

export default MovieItem;
