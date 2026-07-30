import { X } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useSwipeGesture } from "@/hooks/useSwipeGesture.ts";
import type { RecentEntry } from "@/hooks/useRecentSearches.ts";

type RecentSearchItemProps = {
  entry: RecentEntry;
  isSwipeOpen: boolean;
  onOpen: (entry: RecentEntry) => void;
  onDelete: (label: string) => void;
  onSwipeOpen: () => void;
  onSwipeClose: () => void;
  onSwipeBegin: () => void;
};

const ACTIONS_WIDTH = 56;
const OPEN_THRESHOLD = 48;

const RecentSearchItem = ({
  entry,
  isSwipeOpen,
  onOpen,
  onDelete,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: Readonly<RecentSearchItemProps>) => {
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

  const handleClick = (e: MouseEvent) => {
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
    onOpen(entry);
  };

  return (
    <div
      className={`movie-item-wrapper${showActions ? " movie-item-wrapper--actions-visible" : ""}`}
      style={{ "--actions-width": `${ACTIONS_WIDTH}px` } as CSSProperties}
    >
      <div className="movie-item-management">
        <button
          type="button"
          className="movie-item-management__delete"
          onClick={() => { closeSwipe(); hapticTabTap(); onDelete(entry.label); }}
        >
          <X size={16} />
        </button>
      </div>
      <article
        tabIndex={-1}
        className="movie-item"
        aria-label={entry.label}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onTransitionEnd={(e) => handleTransitionEnd(e.propertyName)}
        {...touchHandlers}
      >
        <button
          type="button"
          className="movie-item-header"
          onClick={handleClick}
          onKeyDown={(e) => { if (e.key === "Escape" && isRevealed) closeSwipe(); }}
        >
          <div className="movie-item-header__left">
            <span className="movie-item-header__title">{entry.label}</span>
          </div>
        </button>
      </article>
    </div>
  );
};

export default RecentSearchItem;
