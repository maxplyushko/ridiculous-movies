import {useEffect, useState} from "react";
import {checkAccess, PRIVATE_USE_MESSAGE, type AuthResponse} from "../api/auth.ts";
import {PageLoader} from "./PageLoader.tsx";
import { getTelegramId } from "../api/telegram.ts";

type AuthGateProps = {
  children: (session: AuthResponse) => React.ReactNode;
};

export function AuthGate({children}: AuthGateProps) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkAccess()
    .then((data) => {
      if (!cancelled) {
        setSession(data);
      }
    })
    .catch((err: unknown) => {
      if (!cancelled) {
        setDeniedMessage(
            (err instanceof Error ? err.message : PRIVATE_USE_MESSAGE)
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (deniedMessage) {
    return (
        <div className="access-denied">
          <p>{deniedMessage} User ID: {getTelegramId()}</p>
        </div>
    );
  }

  if (!session) {
    return <PageLoader/>;
  }

  return <>{children(session)}</>;
}
