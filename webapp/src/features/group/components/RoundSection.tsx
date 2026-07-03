import { useTranslation } from "react-i18next";
import type { MovieGroup } from "../types/MovieGroup.ts";
import type { Movie } from "../types/Movie.ts";
import MovieItem from "./MovieItem.tsx";

type RoundSectionProps = {
  movieGroup: MovieGroup;
  openSwipeId: string | null;
  isAdmin: boolean;
  onOpen: (movie: Movie) => void;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: (id: string) => void;
  onSwipeBegin: (id: string) => void;
};

export function RoundSection({
  movieGroup,
  openSwipeId,
  isAdmin,
  onOpen,
  onEdit,
  onDelete,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: Readonly<RoundSectionProps>) {
  const { t } = useTranslation();
  return (
    <div className="movie-group">
      <div className="movie-group__header">
        <div className="movie-group__header__round">
          <h3>{t('groupList.labelRound')} {movieGroup.groupId}</h3>
        </div>
      </div>
      {movieGroup.movies.map((movie) => (
        <MovieItem
          key={movie.id}
          movie={movie}
          isSwipeOpen={openSwipeId === movie.id}
          canDelete={isAdmin}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onSwipeOpen={() => onSwipeOpen(movie.id)}
          onSwipeClose={() => onSwipeClose(movie.id)}
          onSwipeBegin={() => onSwipeBegin(movie.id)}
        />
      ))}
    </div>
  );
}
