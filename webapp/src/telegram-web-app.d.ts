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

  interface TelegramBackButton {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  }

  interface TelegramMainButton {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): TelegramMainButton;
    show(): TelegramMainButton;
    hide(): TelegramMainButton;
    enable(): TelegramMainButton;
    disable(): TelegramMainButton;
    showProgress(leaveActive?: boolean): TelegramMainButton;
    hideProgress(): TelegramMainButton;
    onClick(callback: () => void): TelegramMainButton;
    offClick(callback: () => void): TelegramMainButton;
  }

  type TelegramWebAppEventType =
    | "themeChanged"
    | "viewportChanged"
    | "backButtonClicked"
    | "mainButtonClicked";

  interface TelegramViewportChangedEvent {
    isStateStable: boolean;
  }

  interface TelegramWebApp {
    initData?: string;
    version?: string;
    viewportHeight?: number;
    viewportStableHeight?: number;
    isExpanded?: boolean;
    colorScheme?: "light" | "dark";
    themeParams?: TelegramThemeParams;
    HapticFeedback?: TelegramWebAppHapticFeedback;
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;
    BackButton?: TelegramBackButton;
    MainButton?: TelegramMainButton;

    ready(): void;
    expand(): void;
    disableVerticalSwipes?(): void;
    enableVerticalSwipes?(): void;
    isVersionAtLeast?(version: string): boolean;
    openLink?(url: string): void;

    onEvent?(eventType: "viewportChanged", eventHandler: (event: TelegramViewportChangedEvent) => void): void;
    onEvent?(eventType: Exclude<TelegramWebAppEventType, "viewportChanged">, eventHandler: () => void): void;
    offEvent?(eventType: "viewportChanged", eventHandler: (event: TelegramViewportChangedEvent) => void): void;
    offEvent?(eventType: Exclude<TelegramWebAppEventType, "viewportChanged">, eventHandler: () => void): void;

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
