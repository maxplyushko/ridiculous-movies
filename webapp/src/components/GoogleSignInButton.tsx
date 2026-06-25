import * as React from "react";
import { oauthLogin } from "../api/auth.ts";
import { tokenStore } from "../api/client.ts";

type Props = {
  onSuccess: () => void;
  onError: (msg: string) => void;
};

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignInButton({ onSuccess, onError }: Readonly<Props>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    function tryInit() {
      if (cancelled) return;
      if (typeof google === "undefined") {
        requestAnimationFrame(tryInit);
        return;
      }
      if (!containerRef.current) return;
      google.accounts.id.initialize({
        client_id: CLIENT_ID!,
        callback: async (response) => {
          try {
            const res = await oauthLogin(response.credential);
            tokenStore.set(res.accessToken);
            onSuccess();
          } catch (e) {
            onError(e instanceof Error ? e.message : "Sign-in failed");
          }
        },
        cancel_on_tap_outside: false,
      });
      google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
      });
      setReady(true);
    }

    requestAnimationFrame(tryInit);
    return () => { cancelled = true; };
  }, [onSuccess, onError]);

  if (!CLIENT_ID) {
    return <p className="google-signin__error">Google sign-in not configured.</p>;
  }

  return (
    <div className="google-signin__wrapper">
      {!ready && <div className="google-signin__spinner" />}
      <div ref={containerRef} />
    </div>
  );
}