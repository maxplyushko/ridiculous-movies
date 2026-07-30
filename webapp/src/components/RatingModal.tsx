import { useState } from "react";
import { Loader } from "lucide-react";
import { RatingEditor } from "@/components/RatingEditor.tsx";
import { calcDetailedScore, roundHalf, type DetailedScores, type RatingMode } from "@/hooks/useRatingForm.ts";
import { useDialogA11y } from "@/hooks/useDialogA11y.ts";
import { hapticTabTap } from "@/utils/haptics.ts";

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
  const hasScore = initialScore != null && initialScore > 0;
  const initDetailed = hasScore ? Math.round(initialScore) : null;
  const [mode, setMode] = useState<RatingMode>(defaultMode);
  const [detailed, setDetailed] = useState<DetailedScores>(
    initDetailed ? { r1: initDetailed, r2: initDetailed, r3: initDetailed } : { r1: null, r2: null, r3: null }
  );
  const [classicValue, setClassicValue] = useState<number | null>(hasScore ? roundHalf(initialScore) : null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = mode === "detailed" ? calcDetailedScore(detailed) : classicValue;

  const toggleMode = () => {
    hapticTabTap();
    const next = mode === "detailed" ? "classic" : "detailed";
    if (next === "classic") {
      const s = calcDetailedScore(detailed);
      if (s !== null) setClassicValue(roundHalf(s));
    } else if (classicValue !== null) {
      const v = Math.round(classicValue);
      setDetailed({ r1: v, r2: v, r3: v });
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

  const dialogRef = useDialogA11y(onCancel);

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="confirm-dialog personal-rating-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
      >
        <p className="rating-modal__title" id="rating-modal-title">{title}</p>
        <RatingEditor
          mode={mode}
          detailed={detailed}
          classicValue={classicValue}
          onToggleMode={toggleMode}
          onDetailedChange={(field, value) => setDetailed((prev) => ({ ...prev, [field]: value }))}
          onClassicChange={setClassicValue}
        />
        {error && <span className="confirm-dialog__error">{error}</span>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isSaving}>{cancelLabel}</button>
          <button type="button" onClick={handleSave} disabled={score === null || isSaving} aria-busy={isSaving}>
            {isSaving && <Loader size={14} className="tmdb-section__spinner" aria-hidden="true" />}
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
