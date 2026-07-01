import type { PersonalMovie } from "../types/PersonalMovie.ts";
import PersonalMovieItem from "./PersonalMovieItem.tsx";

type PersonalSectionProps = {
  title: string;
  movies: PersonalMovie[];
  openSwipeId: string | null;
  expandedId: string | null;
  celebratingId: string | null;
  onEdit: (movie: PersonalMovie) => void;
  onDelete: (movie: PersonalMovie) => void;
  onToggleWatched: (movie: PersonalMovie) => void;
  onToggle: (id: string) => void;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: (id: string) => void;
  onSwipeBegin: (id: string) => void;
};

export function PersonalSection({
  title,
  movies,
  openSwipeId,
  expandedId,
  celebratingId,
  onEdit,
  onDelete,
  onToggleWatched,
  onToggle,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: Readonly<PersonalSectionProps>) {
  if (movies.length === 0) return null;
  return (
    <div className="movie-group">
      <div className="movie-group__header">
        <h3>{title}</h3>
      </div>
      {movies.map((movie) => (
        <PersonalMovieItem
          key={movie.id}
          movie={movie}
          isExpanded={expandedId === movie.id}
          isSwipeOpen={openSwipeId === movie.id}
          isCelebrating={celebratingId === movie.id}
          onToggle={() => onToggle(movie.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleWatched={onToggleWatched}
          onSwipeOpen={() => onSwipeOpen(movie.id)}
          onSwipeClose={() => onSwipeClose(movie.id)}
          onSwipeBegin={() => onSwipeBegin(movie.id)}
        />
      ))}
    </div>
  );
}
