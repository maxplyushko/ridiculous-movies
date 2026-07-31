import { useEffect, type ReactNode } from "react";
import { ListSearchBar } from "@/components/ListSearchBar.tsx";
import { PageBackButton } from "@/components/PageBackButton.tsx";

const SEARCH_PAGE_CLASS = "search-page-open";

type ListSearchPageProps = {
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  onBack: () => void;
  children: ReactNode;
};

/**
 * Full-screen shell for a list page's own search. Owns the search bar and the
 * `body.search-page-open` class that hides the bottom bar for the page's whole
 * lifetime; the caller supplies the filtered results as children.
 */
export function ListSearchPage({ placeholder, query, onQueryChange, onBack, children }: Readonly<ListSearchPageProps>) {
  useEffect(() => {
    document.body.classList.add(SEARCH_PAGE_CLASS);
    return () => document.body.classList.remove(SEARCH_PAGE_CLASS);
  }, []);

  return (
    <>
      <PageBackButton onBack={onBack} />
      <ListSearchBar value={query} onChange={onQueryChange} placeholder={placeholder} autoFocus />
      <div className="movie-list">{children}</div>
    </>
  );
}
