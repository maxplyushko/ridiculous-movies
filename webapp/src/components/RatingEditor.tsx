import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { StarRating } from "@/components/StarRating.tsx";
import { calcDetailedScore, type DetailedScores, type RatingMode } from "@/hooks/useRatingForm.ts";

const RATING_CATEGORIES: Array<{ key: keyof DetailedScores; labelKey: string }> = [
  { key: "r1", labelKey: "addMovie.ratingR1" },
  { key: "r2", labelKey: "addMovie.ratingR2" },
  { key: "r3", labelKey: "addMovie.ratingR3" },
];

type RatingEditorProps = {
  mode: RatingMode;
  detailed: DetailedScores;
  classicValue: number | null;
  onToggleMode: () => void;
  onDetailedChange: (field: keyof DetailedScores, value: number | null) => void;
  onClassicChange: (value: number | null) => void;
};

export function RatingEditor({
  mode,
  detailed,
  classicValue,
  onToggleMode,
  onDetailedChange,
  onClassicChange,
}: Readonly<RatingEditorProps>) {
  const { t } = useTranslation();
  const score = mode === "detailed" ? calcDetailedScore(detailed) : classicValue;

  return (
    <>
      <button type="button" className="rating-value-toggle" onClick={onToggleMode}>
        <span className="rating-value-toggle__score">{(score ?? 0).toFixed(2)}</span>
        <ChevronDown
          size={16}
          className={`rating-value-toggle__arrow${mode === "detailed" ? " rating-value-toggle__arrow--flipped" : ""}`}
        />
      </button>
      {mode === "detailed" ? (
        <div className="rating-card__detailed">
          {RATING_CATEGORIES.map(({ key, labelKey }) => (
            <div key={key} className="rating-category">
              <span className="rating-category__label">{t(labelKey)}</span>
              <StarRating value={detailed[key]} onChange={(v) => onDetailedChange(key, v)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rating-card__classic">
          <StarRating value={classicValue} onChange={onClassicChange} />
        </div>
      )}
    </>
  );
}
