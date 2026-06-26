import * as React from "react";
import { GoogleSignInButton } from "./GoogleSignInButton.tsx";
import { guestLogin } from "../api/auth.ts";
import { tokenStore } from "../api/client.ts";
import { User } from "lucide-react";
import { hapticTabTap } from "../haptics.ts";
import iconSvg from "../assets/icon.svg";

type Props = {
  onSuccess: () => void;
};

export function SignInScreen({ onSuccess }: Readonly<Props>) {
  const [error, setError] = React.useState<string | null>(null);
  const [guestPending, setGuestPending] = React.useState(false);

  const handleGuest = async () => {
    hapticTabTap();
    setGuestPending(true);
    setError(null);
    try {
      const res = await guestLogin();
      tokenStore.set(res.accessToken);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setGuestPending(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__bg" aria-hidden="true">
        <div className="auth-screen__orb auth-screen__orb--1" />
        <div className="auth-screen__orb auth-screen__orb--2" />
        <div className="auth-screen__orb auth-screen__orb--3" />
      </div>
      <div className="auth-screen__body">
        <header className="auth-screen__header">
          <img src={iconSvg} alt="" className="auth-screen__logo" />
          <h1 className="auth-screen__title">Ridiculous Movies</h1>
          <p className="auth-screen__tagline">Private movie club</p>
          <p className="auth-screen__desc">
            Rate films, compare picks, and track your group&apos;s movie history across every round.
          </p>
        </header>
        <div className="auth-screen__card">
          <p className="auth-screen__card-label">Sign in to continue</p>
          <GoogleSignInButton onSuccess={onSuccess} onError={setError} />
          <div className="auth-screen__divider"><span>or</span></div>
          <button
            className="auth-screen__guest-btn"
            onClick={handleGuest}
            disabled={guestPending}
          >
            <User size={16} />
            {guestPending ? "Loading…" : "Continue as guest"}
          </button>
          {error && <p className="auth-screen__error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
