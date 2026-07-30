import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Slider from "@radix-ui/react-slider";
import confetti from "canvas-confetti";
import type { User } from "@/types/User.ts";
import type { MovieGroup } from "../types/MovieGroup.ts";
import { FireworkSparks } from "@/components/FireworkSparks.tsx";
import { hapticTabTap } from "@/utils/haptics.ts";
import { Dialog } from "@/components/Dialog.tsx";
import { randomInt } from "@/utils/random.ts";
import { useReelPicker } from "@/hooks/useReelPicker.ts";

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

function useRevealConfetti(final: unknown, spinning: boolean, resultKey: number) {
  useEffect(() => {
    if (final === null || spinning) return;
    confetti(CONFETTI_OPTS);
  }, [resultKey, final, spinning]);
}

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
  const numberReel = useReelPicker<number>();
  const hostReel = useReelPicker<string>();

  useRevealConfetti(numberReel.final, numberReel.spinning, numberReel.resultKey);
  useRevealConfetti(hostReel.final, hostReel.spinning, hostReel.resultKey);

  const pick = () => {
    hapticTabTap();
    const range = npMax - npMin + 1;
    numberReel.spin(() => npMin + randomInt(range));
  };

  const pickHost = () => {
    hapticTabTap();
    if (users.length === 0) return;
    const currentGroup = movieGroups.find((g) => g.groupId === currentRound);
    const hostedIds = new Set(currentGroup?.movies.map((m) => m.owner.id) ?? []);
    const remaining = users.filter((u) => !hostedIds.has(u.id));
    const candidates = remaining.length > 0 ? remaining : users;
    hostReel.spin(() => candidates[randomInt(candidates.length)].name);
  };

  const switchMode = (newMode: "number" | "host") => {
    hapticTabTap();
    setMode(newMode);
    if (newMode === "host") pickHost();
  };

  return (
    <Dialog className="confirm-dialog mlp__number-picker" onClose={onClose}>
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
            {numberReel.display === null ? (
              <>
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
                    onValueChange={([min, max]) => { setNpMin(min); setNpMax(max); numberReel.reset(); }}
                  >
                    <Slider.Track className="mlp__range-track">
                      <Slider.Range className="mlp__range-range" />
                    </Slider.Track>
                    <Slider.Thumb className="mlp__range-thumb" />
                    <Slider.Thumb className="mlp__range-thumb" />
                  </Slider.Root>
                </div>

                <div className="mlp__action-row mlp__action-row--gap-top mlp__action-row--split">
                  {!numberReel.spinning && (
                    <button type="button" className="misc-page__generate misc-page__generate--secondary" onClick={() => { hapticTabTap(); onClose(); }}>
                      {t('groupList.btnCancel')}
                    </button>
                  )}
                  <button type="button" className="misc-page__generate" onClick={pick}>
                    {t('groupList.btnGenerate')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="misc-page__result">
                  {!numberReel.spinning && numberReel.final !== null && <FireworkSparks key={numberReel.resultKey} />}
                  <span className="misc-page__result-label">{numberReel.spinning ? t('groupList.labelPicking') : t('groupList.labelYourNumber')}</span>
                  <div className={`mlp__reel${numberReel.spinning ? " mlp__reel--spinning" : ""}`}>
                    <span
                      key={numberReel.spinning ? `spin-${numberReel.display}` : `result-${numberReel.resultKey}`}
                      className={`misc-page__result-number${numberReel.spinning ? " misc-page__result-number--spinning" : ""}`}
                    >
                      {numberReel.display}
                    </span>
                  </div>
                </div>

                {!numberReel.spinning && numberReel.final !== null && (
                  <div className="mlp__action-row mlp__action-row--split">
                    <button type="button" className="misc-page__generate misc-page__generate--secondary" onClick={numberReel.reset}>
                      {t('groupList.btnTryAgain')}
                    </button>
                    <button type="button" className="mlp__result-ok" onClick={() => { hapticTabTap(); onClose(); }}>{t('groupList.btnOk')}</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {mode === "host" && (
          <>
            {hostReel.display === null ? (
              <div className="mlp__action-row mlp__action-row--gap-top mlp__action-row--split">
                {!hostReel.spinning && (
                  <button type="button" className="misc-page__generate misc-page__generate--secondary" onClick={() => { hapticTabTap(); onClose(); }}>
                    {t('groupList.btnCancel')}
                  </button>
                )}
                <button type="button" className="misc-page__generate" onClick={pickHost}>
                  {t('groupList.btnGenerate')}
                </button>
              </div>
            ) : (
              <>
                <div className="misc-page__result">
                  {!hostReel.spinning && hostReel.final !== null && <FireworkSparks key={hostReel.resultKey} />}
                  <span className="misc-page__result-label">
                    {hostReel.spinning ? t('groupList.labelPickingHost') : t('groupList.labelNextHost')}
                  </span>
                  <div className={`mlp__reel mlp__reel--sm${hostReel.spinning ? " mlp__reel--spinning" : ""}`}>
                    <span
                      key={hostReel.spinning ? `spin-${hostReel.display}` : `result-${hostReel.resultKey}`}
                      className={`misc-page__result-number misc-page__result-number--sm${hostReel.spinning ? " misc-page__result-number--spinning" : ""}`}
                    >
                      {hostReel.display}
                    </span>
                  </div>
                </div>
                {!hostReel.spinning && hostReel.final !== null && (
                  <div className="mlp__action-row mlp__action-row--split">
                    <button type="button" className="misc-page__generate misc-page__generate--secondary" onClick={pickHost}>
                      {t('groupList.btnTryAgain')}
                    </button>
                    <button type="button" className="mlp__result-ok" onClick={() => { hapticTabTap(); onClose(); }}>{t('groupList.btnOk')}</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
