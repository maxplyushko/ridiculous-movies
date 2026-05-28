import {Film} from "lucide-react";

type BootScreenProps = {
  phase: "warming" | "failed";
  attempt?: number;
  onRetry?: () => void;
};

function BootScreen({phase, attempt = 0, onRetry}: Readonly<BootScreenProps>) {
  if (phase === "failed") {
    return (
        <div className="app-shell">
          <main className="app-main boot-screen" role="alert">
            <Film className="boot-screen__icon boot-screen__icon--idle" size={56} strokeWidth={1.5}
                  aria-hidden/>
            <p className="boot-screen__title">Could not reach the server</p>
            <button type="button" className="boot-screen__retry" onClick={onRetry}>
              Retry
            </button>
          </main>
        </div>
    );
  }

  return (
      <div className="app-shell">
        <main className="app-main boot-screen" role="status" aria-live="polite">
          <Film className="boot-screen__icon" size={56} strokeWidth={1.5} aria-hidden/>
          <p className="boot-screen__title">Starting server…</p>
          {attempt > 0 && (
              <p className="boot-screen__hint">Attempt {attempt}</p>
          )}
        </main>
      </div>
  );
}

export default BootScreen;
