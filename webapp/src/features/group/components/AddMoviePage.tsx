import type { User } from "@/types/User.ts";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { RatingEditor } from "@/components/RatingEditor.tsx";
import type { Movie } from "../types/Movie.ts";
import { addMovie, editMovie, type MovieFormPayload } from "../api/movies.ts";
import { useRatingForm, roundHalf, type DetailedScores, type RatingMode } from "@/hooks/useRatingForm.ts";
import { useTelegramMainButton } from "@/hooks/useTelegramButtons.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { GuestLimitModal } from "@/components/GuestLimitModal.tsx";
import { Presence } from "@/components/Presence.tsx";
import { isTelegramMiniApp } from "@/lib/telegram/telegram.ts";
import { useTmdbSearch } from "@/hooks/useTmdbSearch.ts";
import { fetchTmdbMovieDetails } from "../api/tmdb.ts";
import scrollIntoViewAfterKeyboard from "@/hooks/useScrollIntoViewOnKeyboard.ts";
import { hapticTabTap } from "@/utils/haptics.ts";

const SCORE_MAX = 10;

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
  const { t } = useTranslation();

  return (
      <div className="round-picker-row" ref={containerRef}>
        {[...rounds]
        .sort((a, b) => b - a)
        .map((r) => (
            <button
                key={r}
                type="button"
                className={`round-picker-row__item${r === value ? " round-picker-row__item--active" : ""}`}
                onClick={() => {
                  hapticTabTap();
                  onChange(r);
                }}
            >
              {t('addMovie.roundLabel', {r})}
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
      <RatingEditor
        mode={mode}
        detailed={detailed}
        classicValue={clamped > 0 ? roundHalf(clamped) : null}
        onToggleMode={toggleMode}
        onDetailedChange={(field, value) => onUpdateDetailed(formId, field, value)}
        onClassicChange={(value) => { if (value !== null) onUpdateScore(formId, String(value)); }}
      />
    </div>
  );
}

type AddMoviePageProps = {
  currentRound: number;
  maxRound: number;
  currentUserId: string;
  movie?: Movie;
  users: User[];
  onBack: () => void;
};

const AddMoviePage = ({ currentRound, maxRound, currentUserId, movie, users, onBack }: AddMoviePageProps) => {
  const isEditMode = movie !== undefined;
  const [title, setTitle] = useState(movie?.title ?? "");
  const [description, setDescription] = useState(movie?.description ?? "");
  const [tagline, setTagline] = useState(movie?.tagline ?? "");
  const [ownerId, setOwnerId] = useState(movie?.owner.id ?? currentUserId);
  const [round, setRound] = useState(movie?.round ?? currentRound);
  const [tmdbId, setTmdbId] = useState<number | undefined>(movie?.tmdbId);
  const [tmdbMediaType, setTmdbMediaType] = useState(movie?.tmdbMediaType);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuestLimit, setShowGuestLimit] = useState(false);

  const { t } = useTranslation();
  const { forms, add, remove, updateUser, updateScore, updateMode, updateDetailed, buildRatings } = useRatingForm(movie);
  const submitLabel = isEditMode ? t('addMovie.btnSave') : t('addMovie.btnAdd');
  const isTg = isTelegramMiniApp();

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: MovieFormPayload = {
        title,
        description,
        tagline,
        ownerId,
        round,
        ratings: buildRatings(),
        tmdbId,
        tmdbMediaType,
      };
      if (movie) {
        await editMovie(movie.id, payload);
      } else {
        await addMovie(payload);
      }
      onBack();
    } catch (e) {
      if (e instanceof Error && e.message === "GUEST_LIMIT_REACHED") {
        setShowGuestLimit(true);
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const { results: suggestions } = useTmdbSearch(showSuggestions ? title : "", { minLen: 2, debounceMs: 200, includeTv: true });
  const latestSelectionRef = useRef<number | undefined>(undefined);

  const isSubmitDisabled = isSubmitting || !title.trim();
  useTelegramMainButton(submitLabel, handleSubmit, isSubmitDisabled, isSubmitting);

  return (
    <section className="add-movie">
      <PageBackButton onBack={onBack} />
      <h1>{isEditMode ? t('addMovie.headingEdit') : t('addMovie.headingAdd')}</h1>
      <div className="add-movie__fields">
        <div className="add-movie__item">
          <input
            id="add-movie-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTmdbId(undefined); setTmdbMediaType(undefined); setShowSuggestions(true); }}
            onFocus={(e) => { setShowSuggestions(true); scrollIntoViewAfterKeyboard(e.currentTarget); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
            placeholder=" "
            autoComplete="off"
          />
          <label htmlFor="add-movie-title">{t('addMovie.labelTitle')}</label>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="title-suggestions">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setTitle(s.title);
                      setTmdbId(s.id);
                      setTmdbMediaType(s.mediaType);
                      if (s.overview) setDescription(s.overview);
                      setShowSuggestions(false);
                      latestSelectionRef.current = s.id;
                      fetchTmdbMovieDetails(s.id, s.mediaType)
                        .then((d) => {
                          if (latestSelectionRef.current === s.id && d.tagline) setTagline(d.tagline);
                        })
                        .catch(() => {});
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
          <input
            id="add-movie-tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            onFocus={(e) => { scrollIntoViewAfterKeyboard(e.currentTarget); }}
            placeholder=" "
          />
          <label htmlFor="add-movie-tagline">{t('addMovie.labelTagline')}</label>
        </div>
        <div className="add-movie__item">
          <input
            id="add-movie-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => { scrollIntoViewAfterKeyboard(e.currentTarget); }}
            placeholder=" "
          />
          <label htmlFor="add-movie-desc">{t('addMovie.labelDescription')}</label>
        </div>
        <div className="add-movie__item">
          <p className="add-movie__item-title">{t('groupList.labelRound')}</p>
          <RoundPicker value={round} maxRound={Math.max(maxRound, currentRound) + 1} onChange={setRound} />
        </div>
      </div>

      <div className="add-movie__ratings" aria-labelledby="add-movie-host-heading">
        <div className="add-movie__host-chips">
          <p id="add-movie-host-heading" className="add-movie__item-title">{t('addMovie.sectionHost')}</p>
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
          <button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isSubmitting ? <Loader2 className="add-movie__spinner" size={16} /> : submitLabel}
          </button>
        </div>
      )}
      <Presence show={showGuestLimit}>
        {showGuestLimit && <GuestLimitModal onClose={() => setShowGuestLimit(false)} />}
      </Presence>
    </section>
  );
};

export default AddMoviePage;