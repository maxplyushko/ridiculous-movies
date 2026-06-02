export {}

declare global {
  interface TelegramWebAppUser {
    id?: number | string;
  }

  interface TelegramWebAppInitDataUnsafe {
    user?: TelegramWebAppUser;
    start_param?: string;
  }

  interface TelegramThemeParams {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    bottom_bar_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    section_separator_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
  }

  interface TelegramWebAppHapticFeedback {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;

    notificationOccurred(type: "error" | "success" | "warning"): void;

    selectionChanged(): void;
  }

  interface TelegramWebApp {
    initData?: string;
    colorScheme?: "light" | "dark";
    themeParams?: TelegramThemeParams;
    HapticFeedback?: TelegramWebAppHapticFeedback;
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;

    ready(): void;

    expand(): void;

    onEvent?(eventType: "themeChanged", eventHandler: () => void): void;

    offEvent?(eventType: "themeChanged", eventHandler: () => void): void;

    setHeaderColor?(color: string): void;

    setBackgroundColor?(color: string): void;

    setBottomBarColor?(color: string): void;
  }

  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
