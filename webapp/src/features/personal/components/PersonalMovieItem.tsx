import type { PersonalMovie } from "../types/PersonalMovie";
import type { CSSProperties, KeyboardEvent, MouseEvent, TransitionEvent } from "react";
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

function PersonalItemCheckbox({
  movie,
  readOnly,
  isCelebrating,
  onClick,
  label,
}: Readonly<{
  movie: PersonalMovie;
  readOnly: boolean;
  isCelebrating?: boolean;
  onClick: (e: MouseEvent) => void;
  label: string;
}>) {
  const checkedClass = movie.watched ? " personal-item__checkbox--checked" : "";
  if (readOnly) {
    return (
      <span className={`personal-item__checkbox${checkedClass}`} aria-hidden="true">
        {movie.watched && <Check size={16} strokeWidth={3} />}
      </span>
    );
  }
  const poppingClass = isCelebrating ? " personal-item__checkbox--pop" : "";
  return (
    <button
      type="button"
      className={`personal-item__checkbox${checkedClass}${poppingClass}`}
      onClick={onClick}
      aria-label={label}
    >
      {movie.watched && <Check size={16} strokeWidth={3} />}
    </button>
  );
}

function PersonalItemDetails({ movie }: Readonly<{ movie: PersonalMovie }>) {
  return (
    <>
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
    </>
  );
}

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

  const handleCheckboxClick = (e: MouseEvent) => {
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

  const handleHeaderKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    if (isRevealed) {
      closeSwipe();
      return;
    }
    hapticTabTap();
    onOpen(movie);
  };

  const articleProps = readOnly
    ? {}
    : {
      style: {
        transform: `translateX(${offsetX}px)`,
        transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      } as CSSProperties,
      onTransitionEnd: (e: TransitionEvent) => handleTransitionEnd(e.propertyName),
      ...touchHandlers,
    };

  return (
    <div
      className={`movie-item-wrapper${showActions ? " movie-item-wrapper--actions-visible" : ""}${movie.watched ? " personal-item--watched" : ""}`}
      style={{ "--actions-width": `${ACTIONS_WIDTH}px` } as CSSProperties}
    >
      {!readOnly && (
        <div className="movie-item-management">
          <button
            type="button"
            className="movie-item-management__edit"
            onClick={() => { closeSwipe(); onEdit(movie); }}
            aria-label={t('personalMovie.edit')}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="movie-item-management__delete"
            onClick={() => { closeSwipe(); onDelete(movie); }}
            aria-label={t('personalMovie.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      <article tabIndex={-1} className="movie-item" aria-label={movie.title} {...articleProps}>
        <div
          className="movie-item-header personal-item-header"
          onClick={handleHeaderClick}
          role="button"
          tabIndex={0}
          onKeyDown={handleHeaderKeyDown}
        >
          <PersonalItemCheckbox
            movie={movie}
            readOnly={readOnly}
            isCelebrating={isCelebrating}
            onClick={handleCheckboxClick}
            label={movie.watched ? t('personalMovie.markUnwatched') : t('personalMovie.markWatched')}
          />
          <PersonalItemDetails movie={movie} />
        </div>
      </article>
    </div>
  );
};

export default PersonalMovieItem;
