import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Loader } from "lucide-react";
import { StarRating } from "@/components/StarRating.tsx";
import { calcDetailedScore, type DetailedScores, type RatingMode } from "@/hooks/useRatingForm.ts";
import { hapticTabTap } from "@/utils/haptics.ts";

const RATE_CATEGORIES: Array<{ key: keyof DetailedScores; labelKey: string }> = [
  { key: "r1", labelKey: "addMovie.ratingR1" },
  { key: "r2", labelKey: "addMovie.ratingR2" },
  { key: "r3", labelKey: "addMovie.ratingR3" },
];

type RatingModalProps = {
  title: string;
  initialScore?: number | null;
  defaultMode?: RatingMode;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave: (score: number) => Promise<void> | void;
};

export function RatingModal({ title, initialScore, defaultMode = "detailed", cancelLabel, saveLabel, onCancel, onSave }: Readonly<RatingModalProps>) {
  const { t } = useTranslation();
  const initVal = initialScore != null && initialScore > 0 ? Math.round(initialScore) : null;
  const [mode, setMode] = useState<RatingMode>(defaultMode);
  const [detailed, setDetailed] = useState<DetailedScores>(
    initVal ? { r1: initVal, r2: initVal, r3: initVal } : { r1: null, r2: null, r3: null }
  );
  const [classicValue, setClassicValue] = useState<number | null>(initVal);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = mode === "detailed" ? calcDetailedScore(detailed) : classicValue;

  const toggleMode = () => {
    hapticTabTap();
    const next = mode === "detailed" ? "classic" : "detailed";
    if (next === "classic") {
      const s = calcDetailedScore(detailed);
      if (s !== null) setClassicValue(Math.round(s));
    } else {
      if (classicValue !== null) setDetailed({ r1: classicValue, r2: classicValue, r3: classicValue });
    }
    setMode(next);
  };

  const handleSave = async () => {
    if (score === null) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(score);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog personal-rating-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="rating-modal__title">{title}</p>
        <button type="button" className="rating-value-toggle" onClick={toggleMode}>
          <span className="rating-value-toggle__score">
            {(mode === "detailed" ? score : classicValue ?? 0)?.toFixed(2) ?? "0.00"}
          </span>
          <ChevronDown
            size={16}
            className="rating-value-toggle__arrow"
            style={{ transform: mode === "detailed" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}
          />
        </button>
        {mode === "detailed" ? (
          <div className="rating-card__detailed">
            {RATE_CATEGORIES.map(({ key, labelKey }) => (
              <div key={key} className="rating-category">
                <span className="rating-category__label">{t(labelKey)}</span>
                <StarRating
                  value={detailed[key]}
                  onChange={(v) => setDetailed((prev) => ({ ...prev, [key]: v }))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rating-card__classic">
            <StarRating value={classicValue} onChange={setClassicValue} />
          </div>
        )}
        {error && <span className="confirm-dialog__error">{error}</span>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isSaving}>{cancelLabel}</button>
          <button type="button" onClick={handleSave} disabled={score === null || isSaving}>
            {isSaving ? <Loader size={14} className="tmdb-section__spinner" /> : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
