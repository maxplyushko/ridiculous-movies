import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, Copy, Loader } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import scrollIntoViewAfterKeyboard from "@/hooks/useScrollIntoViewOnKeyboard.ts";
import { useCopyInviteLink } from "@/hooks/useCopyInviteLink.ts";
import { createGroup, joinGroup } from "../api/onboarding.ts";
import { guestLogin } from "@/features/auth/api/auth.ts";
import { tokenStore } from "@/api/client.ts";
import iconSvg from "@/assets/icon.svg";

type Step = "choice" | "askFriend" | "createForm" | "created";

type OnboardingModalProps = {
  onGroupReady: (groupId: string, groupName: string) => void;
};

export function OnboardingModal({ onGroupReady }: Readonly<OnboardingModalProps>) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("choice");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{ groupId: string; groupName: string } | null>(null);
  const { copied, copy: handleCopy } = useCopyInviteLink(inviteCode);
  const [guestPending, setGuestPending] = useState(false);

  const goCreateForm = () => { hapticTabTap(); setStep("createForm"); };
  const goAskFriend = () => { hapticTabTap(); setStep("askFriend"); };
  const goBack = () => { hapticTabTap(); setError(null); setStep("choice"); };

  const handleCreate = async () => {
    if (!name.trim() || isSubmitting) return;
    hapticTabTap();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createGroup(name.trim());
      setCreatedGroup({ groupId: res.groupId, groupName: res.groupName });
      setInviteCode(res.inviteCode);
      setStep("created");
    } catch (e) {
      setError(e instanceof Error ? e.message : t('onboarding.errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || isJoining) return;
    hapticTabTap();
    setIsJoining(true);
    setError(null);
    try {
      const res = await joinGroup(joinCode.trim());
      onGroupReady(res.groupId, res.groupName);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('onboarding.errorGeneric'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleGuest = async () => {
    if (guestPending) return;
    hapticTabTap();
    setGuestPending(true);
    setError(null);
    try {
      const res = await guestLogin();
      tokenStore.setSession(res.accessToken);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('onboarding.errorGeneric'));
      setGuestPending(false);
    }
  };

  const handleDone = () => {
    hapticTabTap();
    if (createdGroup) onGroupReady(createdGroup.groupId, createdGroup.groupName);
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-page__bg" aria-hidden="true">
        <div className="auth-screen__orb auth-screen__orb--1" />
        <div className="auth-screen__orb auth-screen__orb--2" />
        <div className="auth-screen__orb auth-screen__orb--3" />
      </div>
      {step !== "choice" && (
        <button type="button" className="onboarding-page__back" onClick={goBack}>
          <ChevronLeft size={20} />
          {t("onboarding.btnBack")}
        </button>
      )}
      <div className="onboarding-page__body">
        <header className="onboarding-page__header">
          <img src={iconSvg} alt="" className="onboarding-page__logo" />
          <h1 className="onboarding-page__title">{t('signIn.heading')}</h1>
          <p className="onboarding-page__tagline">{t('signIn.tagline')}</p>
        </header>

        <div className="onboarding-page__card">
          {step === "choice" && (
            <>
              <p className="onboarding-page__prompt">{t("onboarding.title")}</p>
              <div className="onboarding__actions">
                <button type="button" className="onboarding__choice-btn" onClick={goCreateForm}>
                  {t("onboarding.btnCreateGroup")}
                </button>
                <button type="button" className="onboarding__choice-btn" onClick={goAskFriend}>
                  {t("onboarding.btnAskFriend")}
                </button>
              </div>
            </>
          )}

          {step === "askFriend" && (
            <>
              <p className="onboarding-page__prompt">{t("onboarding.askFriendHint")}</p>
              <input
                className="onboarding__input onboarding__input--spaced"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onFocus={(e) => scrollIntoViewAfterKeyboard(e.currentTarget)}
                placeholder={t("onboarding.joinCodePlaceholder")}
              />
              {error && <span className="confirm-dialog__error">{error}</span>}
              <button
                type="button"
                className="onboarding__ok-btn"
                onClick={handleJoin}
                disabled={isJoining || !joinCode.trim()}
              >
                {isJoining ? <Loader size={14} className="confirm-dialog__spinner" /> : t("onboarding.btnJoin")}
              </button>
              <div className="auth-screen__divider onboarding__divider--spaced"><span>{t('signIn.or')}</span></div>
              <button type="button" className="onboarding__guest-btn" onClick={handleGuest} disabled={guestPending}>
                {guestPending ? <Loader size={14} className="confirm-dialog__spinner" /> : t("onboarding.btnGuest")}
              </button>
            </>
          )}

          {step === "createForm" && (
            <>
              <p className="onboarding-page__prompt">{t("onboarding.createGroupPrompt")}</p>
              <input
                className="onboarding__input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => scrollIntoViewAfterKeyboard(e.currentTarget)}
                placeholder={t("onboarding.groupNamePlaceholder")}
                autoFocus
              />
              {error && <span className="confirm-dialog__error">{error}</span>}
              <button
                type="button"
                className="onboarding__ok-btn"
                onClick={handleCreate}
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? <Loader size={14} className="confirm-dialog__spinner" /> : t("onboarding.btnCreate")}
              </button>
            </>
          )}

          {step === "created" && createdGroup && inviteCode && (
            <>
              <p className="onboarding-page__prompt">{t("onboarding.createdTitle", { name: createdGroup.groupName })}</p>
              <span className="confirm-dialog__subtitle">{t("onboarding.inviteHint")}</span>
              <div className="onboarding__invite-row">
                <code className="onboarding__invite-code">{inviteCode}</code>
                <button type="button" className="onboarding__copy-btn" onClick={handleCopy} aria-label={t('onboarding.btnCopy')}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <button type="button" className="onboarding__ok-btn" onClick={handleDone}>
                {t("onboarding.btnOk")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
