export type TelegramImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
export type TelegramNotificationType = "error" | "success" | "warning";

export function getTelegramWebApp() {
  return window.Telegram?.WebApp;
}

export function isTelegramMiniApp(): boolean {
  return getTelegramWebApp() != null;
}

export function getTelegramUserId(): string {
  const id = getTelegramWebApp()?.initDataUnsafe?.user?.id;
  return id === undefined ? "" : String(id);
}

export function telegramImpact(style: TelegramImpactStyle): void {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred(style);
}

export function telegramNotification(type: TelegramNotificationType): void {
  getTelegramWebApp()?.HapticFeedback?.notificationOccurred(type);
}

export function telegramSelectionChanged(): void {
  getTelegramWebApp()?.HapticFeedback?.selectionChanged();
}
