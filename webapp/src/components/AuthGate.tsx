import { checkAccess, PRIVATE_USE_MESSAGE, type AuthResponse } from "../api/auth.ts";
import { tokenStore } from "../api/client.ts";
import { getTelegramId } from "../api/telegram.ts";
import { MovieListSkeleton } from "./MovieListSkeleton.tsx";
import { GoogleSignInButton } from "./GoogleSignInButton.tsx";
import { applySavedTheme, hasTelegramThemeContext } from "../telegramTheme.ts";
import * as React from "react";

type AuthGateProps = {
  children: (session: AuthResponse) => React.ReactNode;
};

type State =
  | { mode: "loading" }
  | { mode: "signin"; error?: string }
  | { mode: "error"; message: string }
  | { mode: "ok"; data: AuthResponse };

export function AuthGate({ children }: Readonly<AuthGateProps>) {
  const isTelegram = !!getTelegramId();
  const [state, setState] = React.useState<State>({ mode: "loading" });
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setState({ mode: "loading" });

    checkAccess()
      .then((data) => {
        if (!cancelled) setState({ mode: "ok", data });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        const msg = e.message || "";
        if (!isTelegram && (msg.includes("401") || msg.toLowerCase().includes("invalid or expired"))) {
          tokenStore.clear();
          setState({ mode: "signin" });
        } else {
          setState({ mode: "error", message: msg || PRIVATE_USE_MESSAGE });
        }
      });

    return () => { cancelled = true; };
  }, [isTelegram, retryKey]);

  if (state.mode === "loading") return <MovieListSkeleton />;

  if (state.mode === "error") {
    return (
      <div className="access-denied">
        <p>{state.message}</p>
      </div>
    );
  }

  if (state.mode === "signin") {
    return (
      <div className="google-signin-screen">
        <p className="google-signin-screen__title">Ridiculous Movies</p>
        <GoogleSignInButton
          onSuccess={() => setRetryKey((k) => k + 1)}
          onError={(msg) => setState({ mode: "signin", error: msg })}
        />
        {state.error && <p className="google-signin-screen__error">{state.error}</p>}
      </div>
    );
  }

  if (!hasTelegramThemeContext()) applySavedTheme(state.data.theme);
  return <>{children(state.data)}</>;
}