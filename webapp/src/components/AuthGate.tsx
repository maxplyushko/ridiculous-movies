import { checkAccess, PRIVATE_USE_MESSAGE, type AuthResponse } from "../api/auth.ts";
import { MovieListSkeleton } from "./MovieListSkeleton.tsx";
import { getTelegramId } from "../api/telegram.ts";
import { useAsync } from "../hooks/useAsync.ts";
import { applySavedTheme, hasTelegramThemeContext } from "../telegramTheme.ts";
import * as React from "react";

type AuthGateProps = {
  children: (session: AuthResponse) => React.ReactNode;
};

export function AuthGate({ children }: Readonly<AuthGateProps>) {
  const state = useAsync(checkAccess, []);

  if (state.status === "loading") return <MovieListSkeleton />;
  if (state.status === "error") {
    return (
      <div className="access-denied">
        <p>{state.error.message || PRIVATE_USE_MESSAGE}. Current User ID: {getTelegramId()}</p>
      </div>
    );
  }
  if (!hasTelegramThemeContext()) applySavedTheme(state.data.theme);
  return <>{children(state.data)}</>;
}
