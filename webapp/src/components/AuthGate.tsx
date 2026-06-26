import { checkAccess, telegramLogin, PRIVATE_USE_MESSAGE, type AuthResponse } from "../api/auth.ts";
import { tokenStore } from "../api/client.ts";
import { isTelegramMiniApp, getTelegramWebApp } from "../api/telegram.ts";
import { MovieListSkeleton } from "./MovieListSkeleton.tsx";
import { SignInScreen } from "./SignInScreen.tsx";
import { applySavedTheme, hasTelegramThemeContext } from "../telegramTheme.ts";
import * as React from "react";

type AuthGateProps = {
  children: (session: AuthResponse) => React.ReactNode;
};

type State =
  | { mode: "loading" }
  | { mode: "signin" }
  | { mode: "error"; message: string }
  | { mode: "ok"; data: AuthResponse };

export function AuthGate({ children }: Readonly<AuthGateProps>) {
  const [state, setState] = React.useState<State>({ mode: "loading" });
  const [retryKey, setRetryKey] = React.useState(0);
  const tgRetriedRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    setState({ mode: "loading" });

    const run = async () => {
      if (isTelegramMiniApp() && !tokenStore.get()) {
        const tg = getTelegramWebApp();
        if (tg?.initData) {
          const res = await telegramLogin(tg.initData);
          tokenStore.set(res.accessToken);
        }
      }
      const data = await checkAccess();
      if (!cancelled) setState({ mode: "ok", data });
    };

    run().catch((e: Error) => {
      if (cancelled) return;
      const msg = e.message || "";
      if (msg.toLowerCase().includes("invalid or expired")) {
        tokenStore.clear();
        if (isTelegramMiniApp() && !tgRetriedRef.current) {
          tgRetriedRef.current = true;
          setRetryKey((k) => k + 1);
          return;
        }
        setState({ mode: "signin" });
      } else if (msg === PRIVATE_USE_MESSAGE) {
        setState({ mode: "signin" });
      } else {
        setState({ mode: "error", message: msg || PRIVATE_USE_MESSAGE });
      }
    });

    return () => { cancelled = true; };
  }, [retryKey]);

  if (state.mode === "loading") return <MovieListSkeleton />;

  if (state.mode === "error") {
    return (
      <div className="access-denied">
        <p>{state.message}</p>
      </div>
    );
  }

  if (state.mode === "signin") {
    return <SignInScreen onSuccess={() => setRetryKey((k) => k + 1)} />;
  }

  if (!hasTelegramThemeContext()) applySavedTheme(state.data.theme);
  return <>{children(state.data)}</>;
}