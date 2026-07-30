import { useState } from "react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { isTelegramMiniApp } from "@/lib/telegram/telegram.ts";
import { buildInviteLinks } from "@/features/onboarding/inviteLink.ts";

export function useCopyInviteLink(inviteCode: string | null) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!inviteCode) return;
    hapticTabTap();
    const links = buildInviteLinks(inviteCode);
    const link = isTelegramMiniApp() && links.telegram ? links.telegram : links.web;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy };
}
