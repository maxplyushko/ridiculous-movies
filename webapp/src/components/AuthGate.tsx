import { checkAccess, PRIVATE_USE_MESSAGE, type AuthResponse } from "../api/auth.ts";
import { PageLoader } from "./PageLoader.tsx";
import { getTelegramId } from "../api/telegram.ts";
import { useAsync } from "../hooks/useAsync.ts";
import * as React from "react";

type AuthGateProps = {
  children: (session: AuthResponse) => React.ReactNode;
};

export function AuthGate({ children }: Readonly<AuthGateProps>) {
  const state = useAsync(checkAccess, []);

  if (state.status === "loading") return <PageLoader />;
  if (state.status === "error") {
    return (
      <div className="access-denied">
        <p>{state.error.message || PRIVATE_USE_MESSAGE}. Current User ID: {getTelegramId()}</p>
      </div>
    );
  }
  return <>{children(state.data)}</>;
}
