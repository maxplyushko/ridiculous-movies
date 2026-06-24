import type { User } from "../types/User.ts";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import type { Movie } from "../types/Movie.ts";
import { addMovie, editMovie, type MovieFormPayload } from "../api/movies.ts";
import { fetchUsers } from "../api/users.ts";
import { useRatingForm } from "../hooks/useRatingForm.ts";
import { useTelegramBackButton, useTelegramMainButton } from "../hooks/useTelegramButtons.ts";
import { isTelegramMiniApp } from "../api/telegram.ts";
import { useTmdbSearch } from "../hooks/useTmdbSearch.ts";

const SCORE_MIN = 1;
const SCORE_MAX = 10;
const SCORE_STEP = 0.25;
const ITEM_H = 44;

const TICK_LABELS = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => i + SCORE_MIN);

function initials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

type UserChipSelectorProps = {
  users: User[];
  selectedId: string;
  onChange: (id: string) => void;
};

function UserChipSelector({ users, selectedId, onChange }: Readonly<UserChipSelectorProps>) {
  return (
    <div className="user-chip-row">
      {users.map((u) => {
        const selected = u.id === selectedId;
        return (
          <button
            key={u.id}
            type="button"
            className={`user-chip${selected ? " user-chip--selected" : ""}`}
            onClick={() => onChange(u.id)}
          >
            <span className="user-chip__avatar">{initials(u.name)}</span>
            <span className="user-chip__name">{u.name}</span>
          </button>
        );
      })}
    </div>
  );
}

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
    requestAnimationFrame(() => { ignoreScrollRef.current = false; });
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
          <div key={r} className={`round-picker__item${r === value ? " round-picker__item--active" : ""}`}>
            Round {r}
          </div>
        ))}
        <div className="round-picker__pad" />
      </div>
      <div className="round-picker__selection" aria-hidden="true" />
    </div>
  );
}

type RatingCardProps = {
  formId: string;
  userId: string;
  scoreInput: string;
  users: User[];
  onUpdateUser: (id: string, userId: string) => void;
  onUpdateScore: (id: string, score: string) => void;
};

function RatingCard({ formId, userId, scoreInput, users, onUpdateUser, onUpdateScore }: Readonly<RatingCardProps>) {
  const numericScore = parseFloat(scoreInput) || SCORE_MIN;
  const clamped = Math.min(SCORE_MAX, Math.max(SCORE_MIN, numericScore));

  return (
    <div className="rating-card">
      <div className="rating-card__header">
        <UserChipSelector
          users={users}
          selectedId={userId}
          onChange={(id) => onUpdateUser(formId, id)}
        />
      </div>
      <div className="rating-card__slider-area">
        <p className="rating-card__value">{clamped.toFixed(2)}</p>
        <input
          type="range"
          className="rating-card__slider"
          min={SCORE_MIN}
          max={SCORE_MAX}
          step={SCORE_STEP}
          value={clamped}
          onChange={(e) => onUpdateScore(formId, e.target.value)}
          aria-label="Score"
        />
        <div className="rating-card__ticks">
          {TICK_LABELS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

type AddMoviePageProps = {
  currentRound: number;
  maxRound: number;
  movie?: Movie;
  onBack: () => void;
};

const AddMoviePage = ({ currentRound, maxRound, movie, onBack }: AddMoviePageProps) => {
  const isEditMode = movie !== undefined;
  const [title, setTitle] = useState(movie?.title ?? "");
  const [description, setDescription] = useState(movie?.description ?? "");
  const [ownerId, setOwnerId] = useState(movie?.owner.id ?? "");
  const [round, setRound] = useState(movie?.round ?? currentRound);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { forms, add, updateUser, updateScore, buildRatings } = useRatingForm(movie);
  const submitLabel = isEditMode ? "Save" : "Add";
  const isTg = isTelegramMiniApp();

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
        round,
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

  const [showSuggestions, setShowSuggestions] = useState(false);
  const { results: suggestions } = useTmdbSearch(showSuggestions ? title : "", { minLen: 2, debounceMs: 200 });

  const isSubmitDisabled = isSubmitting || !title.trim();
  useTelegramBackButton(onBack);
  useTelegramMainButton(submitLabel, handleSubmit, isSubmitDisabled, isSubmitting);

  return (
    <section className="add-movie">
      <h1>{isEditMode ? "Edit Movie" : "Add Movie"}</h1>
      <div className="add-movie__fields">
        <div className="add-movie__item add-movie__item--autocomplete">
          <label htmlFor="add-movie-title">Title</label>
          <input
            id="add-movie-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setShowSuggestions(true); }}
            onFocus={(e) => { setShowSuggestions(true); setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Title"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="title-suggestions">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setTitle(s.title);
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="title-suggestions__title">{s.title}</span>
                    {s.releaseYear && <span className="title-suggestions__year">{s.releaseYear}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="add-movie__item">
          <label htmlFor="add-movie-desc">Description</label>
          <input
            id="add-movie-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)}
            placeholder="Description"
          />
        </div>
        <div className="add-movie__item">
          <RoundPicker value={round} maxRound={Math.max(maxRound, currentRound) + 1} onChange={setRound} />
        </div>
      </div>

      <div className="add-movie__ratings" aria-labelledby="add-movie-host-heading">
        <p id="add-movie-host-heading" className="add-movie__ratings__title">Host</p>
        <div className="add-movie__host-chips">
          <UserChipSelector
            users={sortedUsers}
            selectedId={ownerId}
            onChange={setOwnerId}
          />
        </div>
      </div>

      <div className="add-movie__ratings" aria-labelledby="add-movie-ratings-heading">
        <p id="add-movie-ratings-heading" className="add-movie__ratings__title">Ratings</p>
        <div className="add-movie__ratings__cards">
          {forms.map((form) => (
            <RatingCard
              key={form.id}
              formId={form.id}
              userId={form.userId}
              scoreInput={form.scoreInput}
              users={sortedUsers}
              onUpdateUser={updateUser}
              onUpdateScore={updateScore}
            />
          ))}
        </div>
        <button type="button" className="add-rater-btn" onClick={add}>
          <UserPlus size={16} />
          Add rater
        </button>
      </div>

      {error && <span className="add-movie__error">{error}</span>}
      {!isTg && (
        <div className="add-movie__control">
          <button type="button" onClick={onBack}>Back</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isSubmitting ? <Loader2 className="add-movie__spinner" size={16} /> : submitLabel}
          </button>
        </div>
      )}
    </section>
  );
};

export default AddMoviePage;
