import * as React from "react";
import { useTranslation } from "react-i18next";
import { guestLogin, getGoogleAuthUrl } from "../api/auth.ts";
import { tokenStore } from "@/api/client.ts";
import { isTelegramMiniApp, getTelegramWebApp } from "@/lib/telegram/telegram.ts";
import { User } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import iconSvg from "@/assets/icon.svg";

type Props = {
  onSuccess: () => void;
};

export function SignInScreen({ onSuccess }: Readonly<Props>) {
  const { t } = useTranslation();
  const [error, setError] = React.useState<string | null>(null);
  const [guestPending, setGuestPending] = React.useState(false);
  const [googleTgState, setGoogleTgState] = React.useState<"idle" | "waiting">("idle");

  const isTg = isTelegramMiniApp();

  const handleGoogle = async () => {
    hapticTabTap();
    setError(null);
    try {
      const url = await getGoogleAuthUrl(!isTg);
      if (isTg) {
        getTelegramWebApp()?.openLink?.(url);
        setGoogleTgState("waiting");
      } else {
        window.location.href = url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('signIn.errorGeneric'));
    }
  };

  const handleGuest = async () => {
    hapticTabTap();
    setGuestPending(true);
    setError(null);
    try {
      const res = await guestLogin();
      tokenStore.set(res.accessToken);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('signIn.errorGeneric'));
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
          <h1 className="auth-screen__title">{t('signIn.heading')}</h1>
          <p className="auth-screen__tagline">{t('signIn.tagline')}</p>
          <p className="auth-screen__desc">{t('signIn.description')}</p>
        </header>
        <div className="auth-screen__card">
          <p className="auth-screen__card-label">{t('signIn.card')}</p>
          {isTg && googleTgState === "waiting" ? (
            <p className="auth-screen__waiting">{t('signIn.browserOpened')}</p>
          ) : (
            <button className="auth-screen__google-tg-btn" onClick={handleGoogle}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('signIn.btnGoogle')}
            </button>
          )}
          <div className="auth-screen__divider"><span>{t('signIn.or')}</span></div>
          <button
            className="auth-screen__guest-btn"
            onClick={handleGuest}
            disabled={guestPending}
          >
            <User size={16} />
            {guestPending ? t('signIn.btnLoading') : t('signIn.btnGuest')}
          </button>
          {error && <p className="auth-screen__error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
