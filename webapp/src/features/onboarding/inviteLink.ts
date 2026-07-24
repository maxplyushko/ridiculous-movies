export function buildInviteLinks(inviteCode: string): { telegram: string; web: string } {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  const telegram = botUsername ? `https://t.me/${botUsername}?startapp=invite_${inviteCode}` : "";
  const web = `${window.location.origin}?invite=${inviteCode}`;
  return { telegram, web };
}
