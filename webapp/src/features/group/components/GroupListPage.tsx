import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../group.css";
import type { MovieGroup } from "../types/MovieGroup.ts";
import type { Movie } from "../types/Movie.ts";
import type { User } from "@/types/User.ts";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import { RoundSection } from "./RoundSection.tsx";
import { RandomizerDialog } from "./RandomizerDialog.tsx";
import AddMoviePage from "./AddMoviePage.tsx";
import { deleteMovie, editMovie, fetchMovieGroups } from "../api/movies.ts";
import { fetchUsers } from "../api/users.ts";
import { MovieListSkeleton } from "@/components/MovieListSkeleton.tsx";
import { ErrorScreen } from "@/components/ErrorScreen.tsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.tsx";
import { SearchInput } from "@/components/SearchInput.tsx";
import { RatingModal } from "@/components/RatingModal.tsx";
import { MoviePage } from "@/components/MoviePage.tsx";
import TmdbSearchSection from "@/components/TmdbSearchSection.tsx";
import { ChartLine, Dices, Plus } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";

const GroupListPage = ({ isAdmin, currentUserId, onShowStats }: { isAdmin: boolean; currentUserId: string; onShowStats: () => void }) => {
  const { t } = useTranslation();
  const [movieGroups, setMovieGroups] = useState<MovieGroup[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRound, setMaxRound] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [viewingMovieId, setViewingMovieId] = useState<string | null>(null);
  const [tmdbMovieToView, setTmdbMovieToView] = useState<TmdbMovie | null>(null);
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | undefined>(undefined);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [ratingMovie, setRatingMovie] = useState<Movie | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addMovieEl, setAddMovieEl] = useState<HTMLDivElement | null>(null);
  const [movieViewEl, setMovieViewEl] = useState<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [npOpen, setNpOpen] = useState(false);
  const [npSliderMax, setNpSliderMax] = useState(10);
  const [npUsers, setNpUsers] = useState<User[]>([]);

  useEffect(() => {
    if (openSwipeId === null) return;
    const close = () => setOpenSwipeId(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [openSwipeId]);

  const ensureUsers = async (): Promise<User[]> => {
    if (users.length > 0) return users;
    try {
      const pool = await fetchUsers();
      setUsers(pool);
      return pool;
    } catch {
      return [];
    }
  };

  const openRandomizer = async () => {
    hapticTabTap();
    const pool = await ensureUsers();
    setNpUsers(pool);
    setNpSliderMax(pool.length > 1 ? pool.length : 10);
    setNpOpen(true);
  };

  const loadMovieGroups = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMovieGroups({ sort: "desc" })
      .then((data) => {
        setMovieGroups(data.groups);
        setCurrentRound(data.currentRound);
        setMaxRound(data.lastRound);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(loadMovieGroups);
    queueMicrotask(ensureUsers);
  }, [loadMovieGroups]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeMovieForm = () => {
    setShowMovieForm(false);
    setEditingMovie(undefined);
    loadMovieGroups();
  };

  useSwipeBack(closeMovieForm, addMovieEl);

  const closeMovieView = () => {
    setViewingMovieId(null);
    setTmdbMovieToView(null);
  };

  useSwipeBack(closeMovieView, movieViewEl);

  const viewingMovie = movieGroups
    .flatMap((g) => g.movies)
    .find((m) => m.id === viewingMovieId) ?? null;

  const handleEdit = (movie: Movie) => {
    setOpenSwipeId(null);
    setEditingMovie(movie);
    setShowMovieForm(true);
  };

  const cancelDelete = () => {
    setMovieToDelete(null);
    setDeleteError(null);
    setIsDeleting(false);
  };

  const executeDelete = async () => {
    if (!movieToDelete) return;
    hapticTabTap();
    setIsDeleting(true);
    try {
      await deleteMovie(movieToDelete.id);
      setMovieToDelete(null);
      setDeleteError(null);
      setIsDeleting(false);
      loadMovieGroups();
    } catch (err) {
      setIsDeleting(false);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete movie");
    }
  };

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const visibleGroups = normalizedQuery
    ? movieGroups
        .map((g) => ({
          ...g,
          movies: g.movies.filter(
            (m) =>
              m.title.toLowerCase().includes(normalizedQuery) ||
              m.description.toLowerCase().includes(normalizedQuery),
          ),
        }))
        .filter((g) => g.movies.length > 0)
    : movieGroups;

  const showTmdb = normalizedQuery.length >= 3;

  if (isLoading) return <MovieListSkeleton />;
  if (error) {
    console.error(error);
    return <ErrorScreen error={error} />;
  }

  return (
    <div className="mlp" onClick={() => { if (openSwipeId !== null) setOpenSwipeId(null); }}>
      <div className="mlp__hero">
        <div className="mlp__cards">
          <button type="button" className="mlp__card" onClick={openRandomizer}>
            <Dices size={20} className="mlp__card-icon" />
            <span className="mlp__card-label">{t('groupList.labelRandom')}</span>
          </button>
          <button type="button" className="mlp__card" onClick={() => { hapticTabTap(); onShowStats(); }}>
            <ChartLine size={20} className="mlp__card-icon" />
            <span className="mlp__card-label">{t('groupList.labelStatistics')}</span>
          </button>
          <button type="button" className="mlp__card mlp__card--accent" onClick={() => { hapticTabTap(); setEditingMovie(undefined); setShowMovieForm(true); }}>
            <Plus size={20} className="mlp__card-icon" />
            <span className="mlp__card-label">{t('groupList.btnAddMovie')}</span>
          </button>
        </div>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t('groupList.placeholderSearch')}
      />

      <div className="movie-list">
        {normalizedQuery && visibleGroups.length === 0 && !showTmdb && (
          <p className="movie-list__no-results">{t('groupList.noMatch')} "{searchQuery}"</p>
        )}
        {showTmdb && visibleGroups.length > 0 && (
          <div className="movie-group__header">
            <h3>{t('groupList.sectionInYourClub')}</h3>
          </div>
        )}
        {visibleGroups.map((group) => (
          <RoundSection
            key={group.groupId}
            movieGroup={group}
            openSwipeId={openSwipeId}
            isAdmin={isAdmin}
            onOpen={(movie) => { setOpenSwipeId(null); setViewingMovieId(movie.id); }}
            onEdit={handleEdit}
            onDelete={(movie) => { setDeleteError(null); setMovieToDelete(movie); }}
            onSwipeOpen={(id) => setOpenSwipeId(id)}
            onSwipeClose={(id) => setOpenSwipeId((cur) => cur === id ? null : cur)}
            onSwipeBegin={(id) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); }}
          />
        ))}
        {showTmdb && <TmdbSearchSection query={searchQuery} onOpenMovie={(m) => setTmdbMovieToView(m)} />}
      </div>

      {showMovieForm && (
        <div className="movie-list__add__movie" ref={setAddMovieEl}>
          <AddMoviePage
            key={editingMovie?.id ?? "new"}
            currentRound={currentRound}
            maxRound={maxRound}
            currentUserId={currentUserId}
            movie={editingMovie}
            users={users}
            onBack={closeMovieForm}
          />
        </div>
      )}

      {(viewingMovie || tmdbMovieToView) && (
        <div className="movie-list__add__movie" ref={setMovieViewEl}>
          {viewingMovie && (
            <MoviePage
              source={{ kind: "group", movie: viewingMovie }}
              currentUserId={currentUserId}
              onBack={closeMovieView}
              onRate={() => setRatingMovie(viewingMovie)}
            />
          )}
          {tmdbMovieToView && (
            <MoviePage
              source={{ kind: "tmdb", movie: tmdbMovieToView }}
              onBack={closeMovieView}
            />
          )}
        </div>
      )}

      {movieToDelete && (
        <ConfirmDialog
          message={t('groupList.confirmDelete', { title: movieToDelete.title })}
          error={deleteError}
          isLoading={isDeleting}
          cancelLabel={t('groupList.btnCancel')}
          confirmLabel={t('groupList.btnDelete')}
          onCancel={cancelDelete}
          onConfirm={executeDelete}
        />
      )}

      {ratingMovie && (
        <RatingModal
          title={ratingMovie.title}
          cancelLabel={t('groupList.btnCancel')}
          saveLabel={t('personalList.btnSave')}
          onCancel={() => setRatingMovie(null)}
          onSave={async (score) => {
            const existingRatings = ratingMovie.ratings.map((r) => ({ userId: r.user.id, score: r.score }));
            await editMovie(ratingMovie.id, {
              title: ratingMovie.title,
              description: ratingMovie.description,
              ownerId: ratingMovie.owner.id,
              round: ratingMovie.round,
              ratings: [...existingRatings, { userId: currentUserId, score }],
              tmdbId: ratingMovie.tmdbId,
              tmdbMediaType: ratingMovie.tmdbMediaType,
            });
            setRatingMovie(null);
            loadMovieGroups();
          }}
        />
      )}

      {npOpen && (
        <RandomizerDialog
          sliderMax={npSliderMax}
          users={npUsers}
          movieGroups={movieGroups}
          currentRound={currentRound}
          onClose={() => setNpOpen(false)}
        />
      )}
    </div>
  );
};

export default GroupListPage;
