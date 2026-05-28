export {}

declare global {
  interface TelegramWebAppUser {
    id?: number | string;
  }

  interface TelegramWebAppInitDataUnsafe {
    user?: TelegramWebAppUser;
  }

  interface TelegramWebAppHapticFeedback {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  }

  interface TelegramWebApp {
    HapticFeedback?: TelegramWebAppHapticFeedback;
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;
    ready(): void;
    expand(): void;
  }

  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
