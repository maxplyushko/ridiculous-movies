import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Loader } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { isTelegramMiniApp } from "@/lib/telegram/telegram.ts";
import { createGroup } from "../api/onboarding.ts";
import { buildInviteLinks } from "../inviteLink.ts";

type Step = "choice" | "askFriend" | "createForm" | "created";

type OnboardingModalProps = {
  onGroupReady: (groupId: string, groupName: string) => void;
};

export function OnboardingModal({ onGroupReady }: Readonly<OnboardingModalProps>) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("choice");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<{ groupId: string; groupName: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    hapticTabTap();
    const links = buildInviteLinks(inviteCode);
    const link = isTelegramMiniApp() && links.telegram ? links.telegram : links.web;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    hapticTabTap();
    if (createdGroup) onGroupReady(createdGroup.groupId, createdGroup.groupName);
  };

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog onboarding" onClick={(e) => e.stopPropagation()}>
        {step === "choice" && (
          <>
            <p>{t("onboarding.title")}</p>
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
            <p>{t("onboarding.askFriendHint")}</p>
            <div className="confirm-dialog__actions">
              <button type="button" onClick={goBack}>{t("onboarding.btnBack")}</button>
            </div>
          </>
        )}

        {step === "createForm" && (
          <>
            <p>{t("onboarding.createGroupPrompt")}</p>
            <input
              className="onboarding__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("onboarding.groupNamePlaceholder")}
              autoFocus
            />
            {error && <span className="confirm-dialog__error">{error}</span>}
            <div className="confirm-dialog__actions">
              <button type="button" onClick={goBack} disabled={isSubmitting}>{t("onboarding.btnBack")}</button>
              <button type="button" onClick={handleCreate} disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? <Loader size={14} className="confirm-dialog__spinner" /> : t("onboarding.btnCreate")}
              </button>
            </div>
          </>
        )}

        {step === "created" && createdGroup && inviteCode && (
          <>
            <p>{t("onboarding.createdTitle", { name: createdGroup.groupName })}</p>
            <span className="confirm-dialog__subtitle">{t("onboarding.inviteHint")}</span>
            <div className="onboarding__invite-row">
              <code className="onboarding__invite-code">{inviteCode}</code>
              <button type="button" className="onboarding__copy-btn" onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="confirm-dialog__actions">
              <button type="button" className="onboarding__ok-btn" onClick={handleDone}>{t("onboarding.btnOk")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
