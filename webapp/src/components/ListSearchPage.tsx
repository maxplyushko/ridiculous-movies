import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ListSearchBar } from "@/components/ListSearchBar.tsx";
import RecentSearchItem from "@/features/search/components/RecentSearchItem.tsx";
import { useHideBottomBar } from "@/hooks/useSubPage.ts";
import { useRecentSearches } from "@/hooks/useRecentSearches.ts";
import { useCloseSwipeOnOutsideTap } from "@/hooks/useCloseSwipeOnOutsideTap.ts";

const KEEP_OPEN_SELECTOR = ".movie-item-wrapper, .mlp__search-bar";

type ListSearchPageProps = {
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  onBack: () => void;
  containerRef: (el: HTMLDivElement | null) => void;
  userId: string;
  scope: string;
  /** Receives a recorder the caller invokes with the picked item's name to store it as a recent. */
  children: (recordRecent: (label: string) => void) => ReactNode;
};

/**
 * Full-screen shell for a list page's own search. Owns the search bar, the recent-searches
 * list, hides the bottom bar for the page's whole lifetime, and closes on a tap into empty
 * space; the caller supplies the filtered results as children.
 */
export function ListSearchPage({
  placeholder,
  query,
  onQueryChange,
  onBack,
  containerRef,
  userId,
  scope,
  children,
}: Readonly<ListSearchPageProps>) {
  const { t } = useTranslation();
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const { recent, addRecent, removeRecent } = useRecentSearches(userId, scope);
  const normalizedQuery = query.trim();

  useHideBottomBar();
  useCloseSwipeOnOutsideTap(openSwipeId, () => setOpenSwipeId(null));

  const recordRecent = (label: string) => addRecent({ kind: "query", label });

  /**
   * True when the gesture started while a swipe row was open. Captured on pointer-down
   * because `useCloseSwipeOnOutsideTap` has already cleared `openSwipeId` by the time the
   * click lands, and that tap must only close the swipe — never also leave the page.
   */
  const consumedBySwipeRef = useRef(false);

  const armSwipeGuard = () => { consumedBySwipeRef.current = openSwipeId !== null; };

  const closeOnEmptySpace = (event: MouseEvent<HTMLDivElement>) => {
    if (consumedBySwipeRef.current) {
      consumedBySwipeRef.current = false;
      return;
    }
    if ((event.target as HTMLElement).closest(KEEP_OPEN_SELECTOR)) return;
    onBack();
  };

  return (
    <div
      className="list-search-page"
      ref={containerRef}
      onPointerDownCapture={armSwipeGuard}
      onClick={closeOnEmptySpace}
    >
      <ListSearchBar
        value={query}
        onChange={onQueryChange}
        placeholder={placeholder}
        autoFocus
        onClose={onBack}
      />
      <div className="movie-list">
        {!normalizedQuery && recent.length === 0 && (
          <p className="movie-list__no-results">{t('search.emptyStart')}</p>
        )}
        {!normalizedQuery && recent.length > 0 && (
          <div className="movie-group">
            <div className="movie-group__header"><h3>{t('search.recentTitle')}</h3></div>
            {recent.map((entry) => (
              <RecentSearchItem
                key={entry.label}
                entry={entry}
                isSwipeOpen={openSwipeId === entry.label}
                onOpen={() => onQueryChange(entry.label)}
                onDelete={removeRecent}
                onSwipeOpen={() => setOpenSwipeId(entry.label)}
                onSwipeClose={() => setOpenSwipeId((cur) => (cur === entry.label ? null : cur))}
                onSwipeBegin={() => { if (openSwipeId !== null && openSwipeId !== entry.label) setOpenSwipeId(null); }}
              />
            ))}
          </div>
        )}
        {normalizedQuery && children(recordRecent)}
      </div>
    </div>
  );
}
