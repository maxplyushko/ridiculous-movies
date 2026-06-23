import type { User } from "../types/User.ts";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CirclePlus, Loader2 } from "lucide-react";
import type { Movie } from "../types/Movie.ts";
import { addMovie, editMovie, type MovieFormPayload } from "../api/movies.ts";
import { fetchUsers } from "../api/users.ts";
import { useRatingForm } from "../hooks/useRatingForm.ts";

const SCORE_MAX = 10;
const ITEM_H = 44;

type RoundPickerProps = {
  value: number;
  maxRound: number;
  onChange: (r: number) => void;
};

function RoundPicker({ value, maxRound, onChange }: Readonly<RoundPickerProps>) {
  const rounds = useMemo(() => Array.from({ length: maxRound + 1 }, (_, i) => i + 1), [maxRound]);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreScrollRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const target = (value - 1) * ITEM_H;
    if (Math.abs(el.scrollTop - target) < 1) return;
    ignoreScrollRef.current = true;
    el.scrollTo({ top: target, behavior: "instant" });
    requestAnimationFrame(() => {
      ignoreScrollRef.current = false;
    });
  }, [value]);

  const handleScroll = () => {
    if (ignoreScrollRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, rounds.length - 1));
      onChange(rounds[clamped]);
    }, 80);
  };

  return (
    <div className="round-picker-wrapper">
      <div className="round-picker" ref={containerRef} onScroll={handleScroll}>
        <div className="round-picker__pad" />
        {rounds.map((r) => (
          <div
            key={r}
            className={`round-picker__item${r === value ? " round-picker__item--active" : ""}`}
          >
            Round {r}
          </div>
        ))}
        <div className="round-picker__pad" />
      </div>
      <div className="round-picker__selection" aria-hidden="true" />
    </div>
  );
}

type AddMoviePageProps = {
  currentRound: number;
  movie?: Movie;
  onBack: () => void;
};

const AddMoviePage = ({ currentRound, movie, onBack }: AddMoviePageProps) => {
  const isEditMode = movie !== undefined;
  const [title, setTitle] = useState(movie?.title ?? "");
  const [description, setDescription] = useState(movie?.description ?? "");
  const [ownerId, setOwnerId] = useState(movie?.owner.id ?? "");
  const [round, setRound] = useState(currentRound);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { forms, selectedUserIds, add, updateUser, updateScore, buildRatings } = useRatingForm(movie);
  const submitLabel = isEditMode ? "Save" : "Add";

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  useEffect(() => {
    fetchUsers().then(setUsers).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: MovieFormPayload = {
        title,
        description,
        ownerId,
        ...(isEditMode ? {} : { round }),
        ratings: buildRatings(),
      };
      if (movie) {
        await editMovie(movie.id, payload);
      } else {
        await addMovie(payload);
      }
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="add-movie">
      <h1>{isEditMode ? "Edit Movie" : "Add Movie"}</h1>
      <div className="add-movie__fields">
        <div className="add-movie__item">
          <label htmlFor="add-movie-title">Title</label>
          <input
            id="add-movie-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
        </div>
        <div className="add-movie__item">
          <label htmlFor="add-movie-desc">Description</label>
          <input
            id="add-movie-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
        <div className="add-movie__item">
          <label htmlFor="add-movie-owner">Owner</label>
          <select id="add-movie-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="" disabled>Host</option>
            {sortedUsers.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        {!isEditMode && (
          <div className="add-movie__item">
            <RoundPicker value={round} maxRound={currentRound} onChange={setRound} />
          </div>
        )}
      </div>

      {ownerId && (
        <div className="add-movie__ratings" aria-labelledby="add-movie-ratings-heading">
          <p id="add-movie-ratings-heading" className="add-movie__ratings__title">
            Set the ratings
          </p>
          <div className="add-movie__ratings__user__scores">
            {forms.map((form) => (
              <div key={form.id} className="add-movie__ratings__form">
                <select
                  value={form.userId}
                  onChange={(e) => updateUser(form.id, e.target.value)}
                  aria-label="User"
                >
                  <option value="" disabled>Select user</option>
                  {sortedUsers
                    .filter(
                      (user) =>
                        ownerId !== user.id &&
                        (!selectedUserIds.has(user.id) || user.id === form.userId),
                    )
                    .map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
                <input
                  className="add-movie__ratings__score"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={form.scoreInput}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => updateScore(form.id, e.target.value)}
                  aria-label="Score"
                  placeholder={`0–${SCORE_MAX}`}
                />
              </div>
            ))}
          </div>
          <div className="add-button">
            <button type="button" onClick={add} aria-label="Add rating row">
              <CirclePlus />
            </button>
          </div>
        </div>
      )}

      {error && <span className="add-movie__error">{error}</span>}
      <div className="add-movie__control">
        <button type="button" onClick={onBack}>Back</button>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="add-movie__spinner" size={16} /> : submitLabel}
        </button>
      </div>
    </section>
  );
};

export default AddMoviePage;
