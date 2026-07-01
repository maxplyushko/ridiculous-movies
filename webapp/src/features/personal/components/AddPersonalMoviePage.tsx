import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import type { PersonalMovie } from "../types/PersonalMovie.ts";
import { addPersonalMovie, editPersonalMovie, type PersonalMoviePayload } from "../api/personalList.ts";
import { useTelegramBackButton, useTelegramMainButton } from "@/hooks/useTelegramButtons.ts";
import { isTelegramMiniApp } from "@/lib/telegram/telegram.ts";
import { useTmdbSearch } from "@/hooks/useTmdbSearch.ts";
import scrollIntoViewAfterKeyboard from "@/hooks/useScrollIntoViewOnKeyboard.ts";

const SCORE_MIN = 1;
const SCORE_MAX = 10;
const SCORE_STEP = 0.25;
const TICK_LABELS = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => i + SCORE_MIN);

type AddPersonalMoviePageProps = {
  movie?: PersonalMovie;
  onBack: () => void;
};

const AddPersonalMoviePage = ({ movie, onBack }: AddPersonalMoviePageProps) => {
  const { t } = useTranslation();
  const isEditMode = movie !== undefined;
  const [title, setTitle] = useState(movie?.title ?? "");
  const [description, setDescription] = useState(movie?.description ?? "");
  const [hasRating, setHasRating] = useState(movie?.rating != null);
  const [rating, setRating] = useState<number>(movie?.rating ?? 5);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [proposedOverview, setProposedOverview] = useState<string | null>(null);

  const { results: suggestions } = useTmdbSearch(showSuggestions ? title : "", { minLen: 2, debounceMs: 200 });
  const isTg = isTelegramMiniApp();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: PersonalMoviePayload = {
        title,
        description,
        rating: hasRating ? rating : null,
      };
      if (movie) {
        await editPersonalMovie(movie.id, { ...payload, watched: movie.watched });
      } else {
        await addPersonalMovie(payload);
      }
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || !title.trim();
  const submitLabel = isEditMode ? t('addPersonal.btnSave') : t('addPersonal.btnAdd');

  useTelegramBackButton(onBack);
  useTelegramMainButton(submitLabel, handleSubmit, isSubmitDisabled, isSubmitting);

  return (
    <section className="add-movie">
      <h1>{isEditMode ? t('addPersonal.headingEdit') : t('addPersonal.headingAdd')}</h1>
      <div className="add-movie__fields">
        <div className="add-movie__item add-movie__item--autocomplete">
          <label htmlFor="pl-movie-title">{t('addPersonal.labelTitle')}</label>
          <input
            id="pl-movie-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setShowSuggestions(true); }}
            onFocus={(e) => { setShowSuggestions(true); scrollIntoViewAfterKeyboard(e.currentTarget); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
            placeholder={t('addPersonal.placeholderTitle')}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="title-suggestions">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setTitle(s.title); if (s.overview) setProposedOverview(s.overview); setShowSuggestions(false); }}
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
          <label htmlFor="pl-movie-desc">{t('addPersonal.labelDescription')}</label>
          <input
            id="pl-movie-desc"
            type="text"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setProposedOverview(null); }}
            onFocus={(e) => { scrollIntoViewAfterKeyboard(e.currentTarget); }}
            placeholder={t('addPersonal.placeholderDescription')}
          />
          {proposedOverview && (
            <div className="overview-proposal">
              <span className="overview-proposal__text">{proposedOverview}</span>
              <div className="overview-proposal__actions">
                <button type="button" onClick={() => setProposedOverview(null)}>{t('addPersonal.btnDismiss')}</button>
                <button type="button" onClick={() => { setDescription(proposedOverview); setProposedOverview(null); }}>{t('addPersonal.btnUse')}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="add-movie__ratings">
        <div className="personal-rating-toggle">
          <p className="add-movie__ratings__title">{t('addPersonal.sectionMyRating')}</p>
          <label className="theme-toggle" aria-label="Include rating">
            <input
              type="checkbox"
              checked={hasRating}
              onChange={(e) => setHasRating(e.target.checked)}
            />
            <span className="theme-toggle__track" />
          </label>
        </div>
        {hasRating && (
          <div className="rating-card">
            <div className="rating-card__slider-area">
              <p className="rating-card__value">{rating.toFixed(2)}</p>
              <input
                type="range"
                className="rating-card__slider"
                min={SCORE_MIN}
                max={SCORE_MAX}
                step={SCORE_STEP}
                value={rating}
                onChange={(e) => setRating(Number.parseFloat(e.target.value))}
                aria-label={t('personalList.labelRating')}
              />
              <div className="rating-card__ticks">
                {TICK_LABELS.map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <span className="add-movie__error">{error}</span>}
      {!isTg && (
        <div className="add-movie__control">
          <button type="button" onClick={onBack}>{t('addPersonal.btnBack')}</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isSubmitting ? <Loader2 className="add-movie__spinner" size={16} /> : submitLabel}
          </button>
        </div>
      )}
    </section>
  );
};

export default AddPersonalMoviePage;
