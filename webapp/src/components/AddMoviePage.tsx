import type { User } from "../types/User.ts";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Loader2, Trash2, UserPlus } from "lucide-react";
import { StarRating } from "./StarRating.tsx";
import type { Movie } from "../types/Movie.ts";
import { addMovie, editMovie, type MovieFormPayload } from "../api/movies.ts";
import { fetchUsers } from "../api/users.ts";
import {
  useRatingForm,
  calcDetailedScore,
  type DetailedScores,
  type RatingMode,
} from "../hooks/useRatingForm.ts";
import { useTelegramBackButton, useTelegramMainButton } from "../hooks/useTelegramButtons.ts";
import { isTelegramMiniApp } from "../api/telegram.ts";
import { useTmdbSearch } from "../hooks/useTmdbSearch.ts";
import scrollIntoViewAfterKeyboard from "../hooks/useScrollIntoViewOnKeyboard.ts";
import { hapticTabTap } from "../haptics.ts";

const SCORE_MAX = 10;

const CATEGORIES: Array<{ key: keyof DetailedScores; labelKey: string }> = [
  { key: "r1", labelKey: "addMovie.ratingR1" },
  { key: "r2", labelKey: "addMovie.ratingR2" },
  { key: "r3", labelKey: "addMovie.ratingR3" },
];

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
            <span className="user-chip__avatar">{u.name.split(/\s+/)[0]}</span>
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
  const rounds = useMemo(() => Array.from({ length: maxRound }, (_, i) => i + 1), [maxRound]);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="round-picker-row" ref={containerRef}>
      {rounds.map((r) => (
        <button
          key={r}
          type="button"
          className={`round-picker-row__item${r === value ? " round-picker-row__item--active" : ""}`}
          onClick={() => { hapticTabTap(); onChange(r); }}
        >
          Round {r}
        </button>
      ))}
    </div>
  );
}

type RatingCardProps = {
  formId: string;
  userId: string;
  scoreInput: string;
  mode: RatingMode;
  detailed: DetailedScores;
  users: User[];
  onUpdateUser: (id: string, userId: string) => void;
  onUpdateScore: (id: string, score: string) => void;
  onUpdateMode: (id: string, mode: RatingMode) => void;
  onUpdateDetailed: (id: string, field: keyof DetailedScores, value: number | null) => void;
  onRemove: (id: string) => void;
};

function RatingCard({
  formId,
  userId,
  scoreInput,
  mode,
  detailed,
  users,
  onUpdateUser,
  onUpdateScore,
  onUpdateMode,
  onUpdateDetailed,
  onRemove,
}: Readonly<RatingCardProps>) {
  const { t } = useTranslation();
  const numericScore = Number.parseFloat(scoreInput) || 0;
  const clamped = Math.min(SCORE_MAX, Math.max(0, numericScore));
  const detailedScore = calcDetailedScore(detailed);
  const toggleMode = () => { hapticTabTap(); onUpdateMode(formId, mode === "detailed" ? "classic" : "detailed"); };

  return (
    <div className="rating-card">
      <div className="rating-card__header">
        <UserChipSelector
          users={users}
          selectedId={userId}
          onChange={(id) => onUpdateUser(formId, id)}
        />
        <button
          type="button"
          className="rating-card__mode-icon-btn"
          onClick={() => { hapticTabTap(); onRemove(formId); }}
          aria-label={t('addMovie.btnRemoveRater')}
        >
          <Trash2 size={18} />
        </button>
      </div>
      <button type="button" className="rating-value-toggle" onClick={toggleMode}>
        <span className="rating-value-toggle__score">
          {(mode === "detailed" ? detailedScore ?? 0 : clamped).toFixed(2)}
        </span>
        <ChevronDown
          size={16}
          className="rating-value-toggle__arrow"
          style={{ transform: mode === "detailed" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}
        />
      </button>
      {mode === "detailed" ? (
        <div className="rating-card__detailed">
          {CATEGORIES.map(({ key, labelKey }) => (
            <div key={key} className="rating-category">
              <span className="rating-category__label">{t(labelKey)}</span>
              <StarRating
                value={detailed[key]}
                onChange={(v) => onUpdateDetailed(formId, key, v)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rating-card__classic">
          <StarRating
            value={clamped > 0 ? Math.round(clamped) : null}
            onChange={(v) => { if (v !== null) onUpdateScore(formId, String(v)); }}
          />
        </div>
      )}
    </div>
  );
}

type AddMoviePageProps = {
  currentRound: number;
  maxRound: number;
  currentUserId: string;
  movie?: Movie;
  onBack: () => void;
};

const AddMoviePage = ({ currentRound, maxRound, currentUserId, movie, onBack }: AddMoviePageProps) => {
  const isEditMode = movie !== undefined;
  const [title, setTitle] = useState(movie?.title ?? "");
  const [description, setDescription] = useState(movie?.description ?? "");
  const [ownerId, setOwnerId] = useState(movie?.owner.id ?? currentUserId);
  const [round, setRound] = useState(movie?.round ?? currentRound);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useTranslation();
  const { forms, add, remove, updateUser, updateScore, updateMode, updateDetailed, buildRatings } = useRatingForm(movie);
  const submitLabel = isEditMode ? t('addMovie.btnSave') : t('addMovie.btnAdd');
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
  const [proposedOverview, setProposedOverview] = useState<string | null>(null);
  const { results: suggestions } = useTmdbSearch(showSuggestions ? title : "", { minLen: 2, debounceMs: 200 });

  const isSubmitDisabled = isSubmitting || !title.trim();
  useTelegramBackButton(onBack);
  useTelegramMainButton(submitLabel, handleSubmit, isSubmitDisabled, isSubmitting);

  return (
    <section className="add-movie">
      <h1>{isEditMode ? t('addMovie.headingEdit') : t('addMovie.headingAdd')}</h1>
      <div className="add-movie__fields">
        <div className="add-movie__item add-movie__item--autocomplete">
          <label htmlFor="add-movie-title">{t('addMovie.labelTitle')}</label>
          <input
            id="add-movie-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setShowSuggestions(true); }}
            onFocus={(e) => { setShowSuggestions(true); scrollIntoViewAfterKeyboard(e.currentTarget); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
            placeholder={t('addMovie.placeholderTitle')}
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
                      if (s.overview) setProposedOverview(s.overview);
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
          <label htmlFor="add-movie-desc">{t('addMovie.labelDescription')}</label>
          <input
            id="add-movie-desc"
            type="text"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setProposedOverview(null); }}
            onFocus={(e) => { scrollIntoViewAfterKeyboard(e.currentTarget); }}
            placeholder={t('addMovie.placeholderDescription')}
          />
          {proposedOverview && (
            <div className="overview-proposal">
              <span className="overview-proposal__text">{proposedOverview}</span>
              <div className="overview-proposal__actions">
                <button type="button" onClick={() => setProposedOverview(null)}>{t('addMovie.btnDismiss')}</button>
                <button type="button" onClick={() => { setDescription(proposedOverview); setProposedOverview(null); }}>{t('addMovie.btnUse')}</button>
              </div>
            </div>
          )}
        </div>
        <div className="add-movie__item">
          <RoundPicker value={round} maxRound={Math.max(maxRound, currentRound) + 1} onChange={setRound} />
        </div>
      </div>

      <div className="add-movie__ratings" aria-labelledby="add-movie-host-heading">
        <p id="add-movie-host-heading" className="add-movie__ratings__title">{t('addMovie.sectionHost')}</p>
        <div className="add-movie__host-chips">
          <UserChipSelector
            users={sortedUsers}
            selectedId={ownerId}
            onChange={setOwnerId}
          />
        </div>
      </div>

      <div className="add-movie__ratings" aria-labelledby="add-movie-ratings-heading">
        <p id="add-movie-ratings-heading" className="add-movie__ratings__title">{t('addMovie.sectionRatings')}</p>
        <div className="add-movie__ratings__cards">
          {forms.map((form) => (
            <RatingCard
              key={form.id}
              formId={form.id}
              userId={form.userId}
              scoreInput={form.scoreInput}
              mode={form.mode}
              detailed={form.detailed}
              users={sortedUsers}
              onUpdateUser={updateUser}
              onUpdateScore={updateScore}
              onUpdateMode={updateMode}
              onUpdateDetailed={updateDetailed}
              onRemove={remove}
            />
          ))}
        </div>
        <button type="button" className="add-rater-btn" onClick={add}>
          <UserPlus size={16} />
          {t('addMovie.btnAddRater')}
        </button>
      </div>

      {error && <span className="add-movie__error">{error}</span>}
      {!isTg && (
        <div className="add-movie__control">
          <button type="button" onClick={onBack}>{t('addMovie.btnBack')}</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isSubmitting ? <Loader2 className="add-movie__spinner" size={16} /> : submitLabel}
          </button>
        </div>
      )}
    </section>
  );
};

export default AddMoviePage;