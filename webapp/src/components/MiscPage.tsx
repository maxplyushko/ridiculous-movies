import {useEffect, useRef, useState} from "react";
import confetti from "canvas-confetti";
import {hapticSpinReveal, hapticSpinStart, hapticSpinTick, stopHaptics} from "../haptics.ts";

const MIN_HOSTS = 1;
const MAX_HOSTS = 5;
const SPIN_TICK_MS = 65;
const SPIN_TICK_COUNT = 20;

const FIREWORK_COLORS = ["#3390ec", "#ff9500", "#ff3b30", "#34c759", "#ffd60a", "#bf5af2"];

function pickRandomHost(hostsAmount: number, prev: number): number {
  if (hostsAmount === 1) {
    return 1;
  }

  let next = prev;
  while (next === prev) {
    next = Math.floor(Math.random() * hostsAmount) + MIN_HOSTS;
  }
  return next;
}

function fireConfettiFromElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  const count = 120;
  const defaults = {
    origin: {x, y},
    colors: FIREWORK_COLORS,
    disableForReducedMotion: true,
  };

  confetti({...defaults, particleCount: count * 0.3, spread: 360, startVelocity: 38, ticks: 80, scalar: 0.9});
  confetti({...defaults, particleCount: count * 0.2, spread: 360, startVelocity: 28, ticks: 70, scalar: 0.7});
  confetti({...defaults, particleCount: count * 0.15, spread: 360, startVelocity: 48, ticks: 90, scalar: 1.1});
}

function FireworkSparks() {
  return (
    <div className="misc-page__fireworks" aria-hidden="true">
      {Array.from({length: 16}, (_, i) => (
        <span key={i} className="misc-page__firework-spark" style={{"--i": i} as React.CSSProperties}/>
      ))}
    </div>
  );
}

const MiscPage = () => {
  const [hostsAmount, setHostsAmount] = useState<number>(MAX_HOSTS);
  const [randomNumber, setRandomNumber] = useState<number>(MIN_HOSTS);
  const [displayNumber, setDisplayNumber] = useState<number>(MIN_HOSTS);
  const [showRandomNumber, setShowRandomNumber] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSpin = () => {
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }
  };

  useEffect(() => () => stopSpin(), []);

  useEffect(() => {
    if (!showRandomNumber || isSpinning || !resultRef.current) {
      return;
    }
    fireConfettiFromElement(resultRef.current);
  }, [resultKey, showRandomNumber, isSpinning]);

  const resetResult = () => {
    stopSpin();
    stopHaptics();
    setIsSpinning(false);
    setShowRandomNumber(false);
  };

  const generateRandomNumber = () => {
    if (isSpinning) {
      return;
    }

    stopSpin();
    stopHaptics();
    const final = pickRandomHost(hostsAmount, randomNumber);

    hapticSpinStart();
    setShowRandomNumber(true);
    setIsSpinning(true);
    setDisplayNumber(Math.floor(Math.random() * hostsAmount) + MIN_HOSTS);

    let ticks = 0;
    spinIntervalRef.current = setInterval(() => {
      ticks += 1;
      setDisplayNumber(Math.floor(Math.random() * hostsAmount) + MIN_HOSTS);
      hapticSpinTick();

      if (ticks >= SPIN_TICK_COUNT) {
        stopSpin();
        setDisplayNumber(final);
        setRandomNumber(final);
        setIsSpinning(false);
        setResultKey((k) => k + 1);
        hapticSpinReveal();
      }
    }, SPIN_TICK_MS);
  };

  return <section className="misc-page">
    <div className="misc-page__card">
      <label className="misc-page__label" htmlFor="hosts-slider">
        Number of Hosts
      </label>
      <p className="misc-page__value">{hostsAmount}</p>
      <div className="misc-page__slider-wrap">
        <input type="range" id="hosts-slider" className="misc-page__slider"
               min={MIN_HOSTS} max={MAX_HOSTS}
               step={1} value={hostsAmount} onChange={o => {
          const number = Number(o.target.value);
          setHostsAmount(number);
          resetResult();
        }}
        />
      </div>
      <div className="misc-page__ticks" aria-hidden="true">
        {Array.from({length: MAX_HOSTS}, (_, i) => i + 1).map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>

    </div>
    <button
      type="button"
      className="misc-page__generate"
      disabled={isSpinning}
      onClick={generateRandomNumber}
    >
      {isSpinning ? "Picking..." : "Generate"}
    </button>
    {showRandomNumber && <div
      ref={resultRef}
      className={`misc-page__result${isSpinning ? " misc-page__result--spinning" : ""}`}
    >
      {!isSpinning && <FireworkSparks key={resultKey}/>}
      <span className="misc-page__result-label">
        {isSpinning ? "PICKING HOST..." : "TODAY'S HOST"}
      </span>
      <span
        key={isSpinning ? `spin-${displayNumber}` : `result-${resultKey}`}
        className={`misc-page__result-number${isSpinning ? " misc-page__result-number--spinning" : ""}`}
      >
        {displayNumber}
      </span>
    </div>}
  </section>
}

export default MiscPage;
