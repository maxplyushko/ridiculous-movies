import { useState } from "react";
import { Loader } from "lucide-react";
import { RatingEditor } from "@/components/RatingEditor.tsx";
import { calcDetailedScore, type DetailedScores, type RatingMode } from "@/hooks/useRatingForm.ts";
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
          <button type="button" onClick={handleSave} disabled={score === null || isSaving}>
            {isSaving ? <Loader size={14} className="tmdb-section__spinner" /> : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
