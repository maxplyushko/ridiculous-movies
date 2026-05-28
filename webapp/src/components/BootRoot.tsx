import {useCallback, useEffect, useState} from "react";
import App from "../App.tsx";
import {waitForServer} from "../api/client.ts";
import {getTelegramWebApp, telegramNotification} from "../api/telegram.ts";
import BootScreen from "./BootScreen.tsx";

type BootPhase = "warming" | "ready" | "failed";

export default function BootRoot() {
  const [bootId, setBootId] = useState(0);
  const [phase, setPhase] = useState<BootPhase>("warming");
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setBootId((id) => id + 1);
    setPhase("warming");
    setAttempt(0);
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    let active = true;

    void (async () => {
      try {
        await waitForServer((n) => {
          if (active) {
            setAttempt(n);
          }
        }, abort.signal);
        if (!active || abort.signal.aborted) {
          return;
        }

        const webApp = getTelegramWebApp();
        webApp?.ready();
        webApp?.expand();
        telegramNotification("success");
        setPhase("ready");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (active && !abort.signal.aborted) {
          setPhase("failed");
        }
      }
    })();

    return () => {
      active = false;
      abort.abort();
    };
  }, [bootId]);

  if (phase === "warming") {
    return <BootScreen phase="warming" attempt={attempt}/>;
  }

  if (phase === "failed") {
    return <BootScreen phase="failed" onRetry={retry}/>;
  }

  return <App/>;
}
