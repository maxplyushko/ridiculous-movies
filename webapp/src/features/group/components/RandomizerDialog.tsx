import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Slider from "@radix-ui/react-slider";
import confetti from "canvas-confetti";
import type { User } from "@/types/User.ts";
import type { MovieGroup } from "../types/MovieGroup.ts";
import { FireworkSparks } from "@/components/FireworkSparks.tsx";
import { hapticSpinReveal, hapticSpinStart, hapticSpinTick, hapticTabTap, stopHaptics } from "@/utils/haptics.ts";

const NP_TICK_MS = 65;
const NP_TICK_COUNT = 20;

const CONFETTI_OPTS = {
  origin: { x: 0.5, y: 0.5 },
  particleCount: 80,
  spread: 360,
  startVelocity: 30,
  ticks: 80,
  scalar: 0.9,
  colors: ["#3390ec", "#ff9500", "#ff3b30", "#34c759", "#ffd60a", "#bf5af2"],
  disableForReducedMotion: true,
};

type RandomizerDialogProps = {
  sliderMax: number;
  users: User[];
  movieGroups: MovieGroup[];
  currentRound: number;
  onClose: () => void;
};

export function RandomizerDialog({ sliderMax, users, movieGroups, currentRound, onClose }: Readonly<RandomizerDialogProps>) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"number" | "host">("number");

  const [npMin, setNpMin] = useState(1);
  const [npMax, setNpMax] = useState(sliderMax);
  const [display, setDisplay] = useState<number | null>(null);
  const [final, setFinal] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const [hostDisplay, setHostDisplay] = useState<string | null>(null);
  const [hostFinal, setHostFinal] = useState<string | null>(null);
  const [hostSpinning, setHostSpinning] = useState(false);
  const [hostResultKey, setHostResultKey] = useState(0);
  const hostIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    clearInterval(hostIntervalRef.current);
    stopHaptics();
  }, []);

  useEffect(() => {
    if (final === null || spinning) return;
    confetti(CONFETTI_OPTS);
  }, [resultKey, final, spinning]);

  useEffect(() => {
    if (hostFinal === null || hostSpinning) return;
    confetti(CONFETTI_OPTS);
  }, [hostResultKey, hostFinal, hostSpinning]);

  const resetResult = () => {
    clearInterval(intervalRef.current);
    stopHaptics();
    setSpinning(false);
    setDisplay(null);
    setFinal(null);
  };

  const pick = () => {
    if (spinning) return;
    hapticTabTap();
    const range = npMax - npMin + 1;
    const chosen = npMin + Math.floor(Math.random() * range);
    hapticSpinStart();
    setSpinning(true);
    setFinal(null);
    setDisplay(npMin + Math.floor(Math.random() * range));
    let ticks = 0;
    intervalRef.current = setInterval(() => {
      ticks++;
      setDisplay(npMin + Math.floor(Math.random() * range));
      hapticSpinTick();
      if (ticks >= NP_TICK_COUNT) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
        stopHaptics();
        setSpinning(false);
        setDisplay(chosen);
        setFinal(chosen);
        setResultKey((k) => k + 1);
        hapticSpinReveal();
      }
    }, NP_TICK_MS);
  };

  const pickHost = () => {
    if (hostSpinning) return;
    hapticTabTap();
    if (users.length === 0) return;
    const currentGroup = movieGroups.find((g) => g.groupId === currentRound);
    const hostedIds = new Set(currentGroup?.movies.map((m) => m.owner.id) ?? []);
    const remaining = users.filter((u) => !hostedIds.has(u.id));
    const candidates = remaining.length > 0 ? remaining : users;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)].name;
    hapticSpinStart();
    setHostSpinning(true);
    setHostFinal(null);
    setHostDisplay(candidates[Math.floor(Math.random() * candidates.length)].name);
    let ticks = 0;
    hostIntervalRef.current = setInterval(() => {
      ticks++;
      setHostDisplay(candidates[Math.floor(Math.random() * candidates.length)].name);
      hapticSpinTick();
      if (ticks >= NP_TICK_COUNT) {
        clearInterval(hostIntervalRef.current);
        hostIntervalRef.current = undefined;
        stopHaptics();
        setHostSpinning(false);
        setHostDisplay(chosen);
        setHostFinal(chosen);
        setHostResultKey((k) => k + 1);
        hapticSpinReveal();
      }
    }, NP_TICK_MS);
  };

  const switchMode = (newMode: "number" | "host") => {
    hapticTabTap();
    setMode(newMode);
    if (newMode === "host") pickHost();
  };

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog mlp__number-picker" onClick={(e) => e.stopPropagation()}>

        <div className="misc-page__default-page-row">
          <button
            type="button"
            className={`misc-page__page-btn${mode === "number" ? " misc-page__page-btn--active" : ""}`}
            onClick={() => switchMode("number")}
          >
            {t('groupList.toggleByNumber')}
          </button>
          <button
            type="button"
            className={`misc-page__page-btn${mode === "host" ? " misc-page__page-btn--active" : ""}`}
            onClick={() => switchMode("host")}
          >
            {t('groupList.toggleByHosts')}
          </button>
        </div>

        <div className="mlp__picker-body">
          {mode === "number" && (
            <>
              {display !== null && (
                <div className="misc-page__result misc-page__result--inline">
                  {!spinning && final !== null && <FireworkSparks key={resultKey} />}
                  <span className="misc-page__result-label">{spinning ? t('groupList.labelPicking') : t('groupList.labelYourNumber')}</span>
                  <span
                    key={spinning ? `spin-${display}` : `result-${resultKey}`}
                    className={`misc-page__result-number${spinning ? " misc-page__result-number--spinning" : ""}`}
                  >
                    {display}
                  </span>
                </div>
              )}

              <div className="mlp__picker-title">{t('groupList.dialogRandomizerTitle')}</div>

              <div className="mlp__range-wrap">
                <div className="mlp__range-labels">
                  <span className="mlp__range-value">{npMin}</span>
                  <span className="mlp__range-value">{npMax}</span>
                </div>
                <Slider.Root
                  className="mlp__range-root"
                  min={1}
                  max={sliderMax}
                  step={1}
                  value={[npMin, npMax]}
                  onValueChange={([min, max]) => { setNpMin(min); setNpMax(max); resetResult(); }}
                >
                  <Slider.Track className="mlp__range-track">
                    <Slider.Range className="mlp__range-range" />
                  </Slider.Track>
                  <Slider.Thumb className="mlp__range-thumb" />
                  <Slider.Thumb className="mlp__range-thumb" />
                </Slider.Root>
              </div>

              {!spinning && final !== null && (
                <div className="mlp__action-row mlp__action-row--split">
                  <button type="button" className="misc-page__generate misc-page__generate--secondary" onClick={pick}>
                    {t('groupList.btnTryAgain')}
                  </button>
                  <button type="button" className="mlp__result-ok" onClick={() => { hapticTabTap(); onClose(); }}>{t('groupList.btnOk')}</button>
                </div>
              )}
              {!spinning && final === null && (
                <div className={`mlp__action-row${display === null ? " mlp__action-row--gap-top" : ""}`}>
                  <button type="button" className="misc-page__generate" onClick={pick}>
                    {t('groupList.btnGenerate')}
                  </button>
                </div>
              )}
            </>
          )}

          {mode === "host" && (
            <>
              {hostDisplay !== null && (
                <div className="misc-page__result misc-page__result--inline">
                  {!hostSpinning && hostFinal !== null && <FireworkSparks key={hostResultKey} />}
                  <span className="misc-page__result-label">
                    {hostSpinning ? t('groupList.labelPickingHost') : t('groupList.labelNextHost')}
                  </span>
                  <span
                    key={hostSpinning ? `spin-${hostDisplay}` : `result-${hostResultKey}`}
                    className={`misc-page__result-number misc-page__result-number--sm${hostSpinning ? " misc-page__result-number--spinning" : ""}`}
                  >
                    {hostDisplay}
                  </span>
                </div>
              )}
              {!hostSpinning && hostFinal !== null && (
                <div className="mlp__action-row mlp__action-row--split">
                  <button type="button" className="misc-page__generate misc-page__generate--secondary" onClick={pickHost}>
                    {t('groupList.btnTryAgain')}
                  </button>
                  <button type="button" className="mlp__result-ok" onClick={() => { hapticTabTap(); onClose(); }}>{t('groupList.btnOk')}</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
