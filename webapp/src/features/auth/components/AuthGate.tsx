import "../auth.css";
import { checkAccess, telegramLogin, exchangeGoogleToken, type AuthResponse } from "../api/auth.ts";
import { tokenStore } from "@/api/client.ts";
import { isTelegramMiniApp, getTelegramWebApp } from "@/lib/telegram/telegram.ts";
import { MovieListSkeleton } from "@/components/MovieListSkeleton.tsx";
import { ErrorScreen } from "@/components/ErrorScreen.tsx";
import { SignInScreen } from "./SignInScreen.tsx";
import { applySavedTheme, hasTelegramThemeContext } from "@/lib/telegram/telegramTheme.ts";
import i18n from "@/lib/i18n/index.ts";
import { setTmdbLang } from "@/utils/tmdbLang.ts";
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
      const urlToken = new URLSearchParams(window.location.search).get("token");
      if (urlToken?.startsWith("gauth_") && !tokenStore.get()) {
        try {
          const res = await exchangeGoogleToken(urlToken);
          tokenStore.set(res.accessToken);
        } catch {
          // consumed or expired — fall through to normal flow
        } finally {
          const url = new URL(window.location.href);
          url.searchParams.delete("token");
          window.history.replaceState({}, "", url.toString());
        }
      }

      const startParam = getTelegramWebApp()?.initDataUnsafe?.start_param;
      if (startParam?.startsWith("gauth_") && !tokenStore.get()) {
        try {
          const res = await exchangeGoogleToken(startParam);
          tokenStore.set(res.accessToken);
        } catch {
          // consumed or expired — fall through to normal flow
        }
      }

      if (isTelegramMiniApp() && !tokenStore.get() && !tokenStore.isLoggedOut()) {
        const tg = getTelegramWebApp();
        if (tg?.initData) {
          try {
            const res = await telegramLogin(tg.initData);
            tokenStore.set(res.accessToken);
          } catch {
            if (!cancelled) setState({ mode: "signin" });
            return;
          }
        }
      }
      const data = await checkAccess();
      if (!cancelled) {
        if (data.lang) {
          i18n.changeLanguage(data.lang);
          localStorage.setItem("i18n-lang", data.lang);
        }
        if (data.tmdbLang) setTmdbLang(data.tmdbLang);
        setState({ mode: "ok", data });
      }
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
      } else {
        setState({ mode: "error", message: msg || "Access denied" });
      }
    });

    return () => { cancelled = true; };
  }, [retryKey]);

  if (state.mode === "loading") return <MovieListSkeleton />;

  if (state.mode === "error") {
    return <ErrorScreen error={new Error(state.message)} fullScreen />;
  }

  if (state.mode === "signin") {
    return <SignInScreen onSuccess={() => setRetryKey((k) => k + 1)} />;
  }

  if (!hasTelegramThemeContext()) applySavedTheme(state.data.theme);
  return <>{children(state.data)}</>;
}