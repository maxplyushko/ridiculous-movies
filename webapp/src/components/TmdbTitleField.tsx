import { useRef, useState } from "react";
import type { TmdbMediaType, TmdbMovie } from "@/types/TmdbMovie.ts";
import { fetchTmdbMovieDetails } from "@/features/group/api/tmdb.ts";
import { useTmdbSearch } from "@/hooks/useTmdbSearch.ts";
import scrollIntoViewAfterKeyboard from "@/hooks/useScrollIntoViewOnKeyboard.ts";

type TmdbTitleFieldProps = {
  id: string;
  label: string;
  title: string;
  onTitleChange: (title: string) => void;
  onSelect: (result: { tmdbId: number; mediaType: TmdbMediaType; description?: string }) => void;
  onTagline: (tagline: string) => void;
};

export function TmdbTitleField({ id, label, title, onTitleChange, onSelect, onTagline }: Readonly<TmdbTitleFieldProps>) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { results: suggestions } = useTmdbSearch(showSuggestions ? title : "", { minLen: 2, debounceMs: 200, includeTv: true });
  const latestSelectionRef = useRef<number | undefined>(undefined);

  const handleSelect = (s: TmdbMovie) => {
    onTitleChange(s.title);
    onSelect({ tmdbId: s.id, mediaType: s.mediaType, description: s.overview || undefined });
    setShowSuggestions(false);
    latestSelectionRef.current = s.id;
    fetchTmdbMovieDetails(s.id, s.mediaType)
      .then((d) => {
        if (latestSelectionRef.current === s.id && d.tagline) onTagline(d.tagline);
      })
      .catch(() => {});
  };

  return (
    <div className="add-movie__item">
      <input
        id={id}
        type="text"
        value={title}
        onChange={(e) => { onTitleChange(e.target.value); setShowSuggestions(true); }}
        onFocus={(e) => { setShowSuggestions(true); scrollIntoViewAfterKeyboard(e.currentTarget); }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
        placeholder=" "
        autoComplete="off"
      />
      <label htmlFor={id}>{label}</label>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="title-suggestions">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
              >
                <span className="title-suggestions__title">{s.title}</span>
                {s.releaseYear && <span className="title-suggestions__year">{s.releaseYear}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
