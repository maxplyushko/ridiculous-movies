import type {Movie} from "../types/Movie";
import {Calendar, Pencil, Star, Trash2, User} from "lucide-react";
import {useEffect, useRef, useState} from "react";

type MovieItemProps = {
  movie: Movie;
  isExpanded: boolean;
  isSwipeOpen: boolean;
  onToggle: () => void;
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
                     isExpanded,
                     isSwipeOpen,
                     onToggle,
                     onEdit,
                     onDelete,
                     onSwipeOpen,
                     onSwipeClose,
                     onSwipeBegin,
                   }: MovieItemProps) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [keepActionsVisible, setKeepActionsVisible] = useState(false);
  const isDraggingRef = useRef(false);
  const offsetRef = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const touchAxis = useRef<"horizontal" | "vertical" | null>(null);
  const swipeBeginNotified = useRef(false);
  const suppressNextClick = useRef(false);

  const isSwipeRevealed = offsetX !== 0 || isSwipeOpen;

  const showActions = offsetX < 0 || isDragging || keepActionsVisible;

  const clampOffset = (value: number) => Math.max(-ACTIONS_WIDTH, Math.min(0, value));

  useEffect(() => {
    offsetRef.current = offsetX;
  }, [offsetX]);

  useEffect(() => {
    if (isSwipeOpen) {
      if (offsetRef.current !== -ACTIONS_WIDTH) {
        setOffsetX(-ACTIONS_WIDTH);
      }
      return;
    }

    if (offsetRef.current !== 0) {
      setKeepActionsVisible(true);
      setOffsetX(0);
    }
  }, [isSwipeOpen]);

  const handleTransitionEnd = (propertyName: string) => {
    if (propertyName !== "transform") {
      return;
    }
    setKeepActionsVisible(false);
  };

  const closeSwipe = () => {
    if (offsetRef.current !== 0) {
      setKeepActionsVisible(true);
    }
    setOffsetX(0);
    onSwipeClose();
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    if (isSwipeRevealed) {
      closeSwipe();
      return;
    }
    onToggle();
  };

  const handleItemClick = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    if (isSwipeRevealed) {
      closeSwipe();
    }
  };

  const handleEdit = () => {
    closeSwipe();
    onEdit(movie);
  };

  const handleDelete = () => {
    closeSwipe();
    onDelete(movie);
  };

  return (
      <div
          className={`movie-item-wrapper${showActions ? " movie-item-wrapper--actions-visible" : ""}`}
          style={{"--actions-width": `${ACTIONS_WIDTH}px`} as React.CSSProperties}
      >
        <div className="movie-item-management">
          <button type="button" className="movie-item-management__edit" onClick={handleEdit}>
            <Pencil size={16}/>
          </button>
          <button type="button" className="movie-item-management__delete" onClick={handleDelete}>
            <Trash2 size={16}/>
          </button>
        </div>
        <div
            className="movie-item"
            onClick={handleItemClick}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget) && isExpanded) {
                onToggle();
              }
            }}
            style={{
              transform: `translateX(${offsetX}px)`,
              transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onTransitionEnd={(e) => handleTransitionEnd(e.propertyName)}
            onTouchStart={(e) => {
              startX.current = e.touches[0].clientX;
              startY.current = e.touches[0].clientY;
              startOffset.current = offsetRef.current;
              touchAxis.current = null;
              swipeBeginNotified.current = false;
              isDraggingRef.current = true;
            }}
            onTouchMove={(e) => {
              if (!isDraggingRef.current) {
                return;
              }
              const touchX = e.touches[0].clientX;
              const touchY = e.touches[0].clientY;
              const deltaX = touchX - startX.current;
              const deltaY = touchY - startY.current;

              if (touchAxis.current === null) {
                if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
                  return;
                }
                touchAxis.current = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
              }

              if (touchAxis.current === "vertical") {
                return;
              }

              if (!swipeBeginNotified.current) {
                swipeBeginNotified.current = true;
                onSwipeBegin();
              }

              setIsDragging(true);
              setOffsetX(clampOffset(startOffset.current + deltaX));
            }}
            onTouchEnd={() => {
              const wasTap = touchAxis.current === null;
              touchAxis.current = null;
              swipeBeginNotified.current = false;
              isDraggingRef.current = false;
              setIsDragging(false);

              if (wasTap && isSwipeRevealed) {
                suppressNextClick.current = true;
                closeSwipe();
                return;
              }

              setOffsetX((current) => {
                const next = current <= -OPEN_THRESHOLD ? -ACTIONS_WIDTH : 0;
                if (next === -ACTIONS_WIDTH) {
                  onSwipeOpen();
                } else {
                  if (current !== 0) {
                    setKeepActionsVisible(true);
                  }
                  onSwipeClose();
                }
                return next;
              });
            }}
        >
          <button type="button" className="movie-item-header" onClick={handleHeaderClick}>
            <div className="movie-item-header__left">
              <span className="movie-item-header__title">{movie.title}</span>
              <span className="movie-item-header__desc">{movie.description}</span>
            </div>
            <div className="movie-item-header__right">
              <div className="movie-item-header__info">
                <span
                    className="movie-item-header__info-item">{(movie.averageRating ?? 0).toFixed(1)}
                  <Star size={16}/> </span>
                <span className="movie-item-header__info-item">{movie.owner.name} <User size={16}/></span>
                <span className="movie-item-header__info-item">{formatDate(movie.createdAt)}
                  <Calendar size={16}/></span>
              </div>
            </div>
          </button>
          <div className={`movie-item-details ${isExpanded ? "open" : ""}`} tabIndex={-1}>
            <div className="movie-item-details__ratings">
              {[...movie.ratings].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map(r => (
                  <span key={r.id} className="movie-item-details__rating-item">
              <User size={16}/> {r.user.name}: {r.score.toFixed(1)}
            </span>))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default MovieItem;
