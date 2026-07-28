import type { PersonalMovie } from "../types/PersonalMovie";
import { Calendar, Check, Pencil, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useSwipeGesture } from "@/hooks/useSwipeGesture.ts";

type PersonalMovieItemProps = {
  movie: PersonalMovie;
  isSwipeOpen: boolean;
  isCelebrating?: boolean;
  readOnly?: boolean;
  onOpen: (movie: PersonalMovie) => void;
  onEdit: (movie: PersonalMovie) => void;
  onDelete: (movie: PersonalMovie) => void;
  onToggleWatched: (movie: PersonalMovie) => void;
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

const PersonalMovieItem = ({
  movie,
  isSwipeOpen,
  isCelebrating,
  readOnly = false,
  onOpen,
  onEdit,
  onDelete,
  onToggleWatched,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: PersonalMovieItemProps) => {
  const { t } = useTranslation();
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

  const handleHeaderClick = (e: React.MouseEvent) => {
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
      className={`movie-item-wrapper${showActions ? " movie-item-wrapper--actions-visible" : ""}${movie.watched ? " personal-item--watched" : ""}`}
      style={{ "--actions-width": `${ACTIONS_WIDTH}px` } as React.CSSProperties}
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
        <div className="movie-item-header personal-item-header" onClick={handleHeaderClick}>
          {readOnly ? (
            <span
              className={`personal-item__checkbox${movie.watched ? " personal-item__checkbox--checked" : ""}`}
              aria-hidden="true"
            >
              {movie.watched && <Check size={14} strokeWidth={3} />}
            </span>
          ) : (
            <button
              type="button"
              className={`personal-item__checkbox${movie.watched ? " personal-item__checkbox--checked" : ""}${isCelebrating ? " personal-item__checkbox--pop" : ""}`}
              onClick={handleCheckboxClick}
              aria-label={movie.watched ? t('personalMovie.markUnwatched') : t('personalMovie.markWatched')}
            >
              {movie.watched && <Check size={14} strokeWidth={3} />}
            </button>
          )}
          <div className="movie-item-header__left">
            <span className={`movie-item-header__title${movie.watched ? " personal-item__title--watched" : ""}`}>
              {movie.title}
            </span>
            {movie.tagline && (
              <span className="movie-item-header__desc">{movie.tagline}</span>
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

export default PersonalMovieItem;
