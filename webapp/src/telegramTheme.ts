import {getTelegramWebApp} from "./api/telegram.ts";

type TelegramThemeParams = {
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
};

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (normalized.length === 3) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16),
    };
  }
  if (normalized.length === 6) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }
  return null;
}

function withAlpha(color: string, alpha: number): string {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return color;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function mixHex(base: string, target: string, targetWeight: number): string | undefined {
  const baseRgb = parseHexColor(base);
  const targetRgb = parseHexColor(target);
  if (!baseRgb || !targetRgb) {
    return undefined;
  }
  const weight = Math.min(Math.max(targetWeight, 0), 1);
  const mix = (from: number, to: number) => Math.round(from + (to - from) * weight);
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(mix(baseRgb.r, targetRgb.r))}${toHex(mix(baseRgb.g, targetRgb.g))}${toHex(mix(baseRgb.b, targetRgb.b))}`;
}

function elevatedSurface(pageBg: string, colorScheme: "light" | "dark"): string {
  return mixHex(pageBg, "#ffffff", colorScheme === "dark" ? 0.11 : 0.88) ?? pageBg;
}

/** True when launched inside Telegram with signed init data (not local browser preview). */
export function hasTelegramThemeContext(): boolean {
  const webApp = getTelegramWebApp();
  return Boolean(webApp?.initData?.trim());
}

function pickColor(...candidates: Array<string | undefined>): string | undefined {
  return candidates.find((color) => Boolean(color?.trim()));
}

function applyThemeParams(params: TelegramThemeParams, colorScheme: "light" | "dark"): void {
  const root = document.documentElement;
  const pageBg = params.bg_color;
  const surface = pickColor(
      params.section_bg_color,
      params.secondary_bg_color,
      pageBg ? elevatedSurface(pageBg, colorScheme) : undefined,
  );
  const accent = pickColor(params.button_color, params.link_color, params.accent_text_color);
  const textPrimary = params.text_color;
  const textSecondary = pickColor(params.hint_color, params.subtitle_text_color, params.section_header_text_color);
  const tabBarBg = pickColor(
      params.bottom_bar_bg_color,
      params.secondary_bg_color,
      pageBg ? elevatedSurface(pageBg, colorScheme) : undefined,
  );
  const tabInactive = pickColor(params.hint_color, params.subtitle_text_color);
  const separator = pickColor(
      params.section_separator_color,
      textSecondary ? withAlpha(textSecondary, 0.35) : undefined,
  );
  const danger = params.destructive_text_color ?? "#ef4444";
  const buttonText = params.button_text_color ?? "#ffffff";

  const assignments: Array<[string, string | undefined]> = [
    ["--page-bg", pageBg],
    ["--surface", surface],
    ["--accent", accent],
    ["--text-primary", textPrimary],
    ["--text-secondary", textSecondary],
    ["--separator", separator],
    ["--tab-bar-bg", tabBarBg],
    ["--tab-inactive", tabInactive],
    ["--danger", danger],
    ["--button-text", buttonText],
  ];

  for (const [name, value] of assignments) {
    if (value) {
      root.style.setProperty(name, value);
    }
  }

  root.dataset.colorScheme = colorScheme;
  root.style.colorScheme = colorScheme;
}

function syncTelegramChrome(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return;
  }

  webApp.setBackgroundColor?.("bg_color");
  webApp.setHeaderColor?.("secondary_bg_color");
  webApp.setBottomBarColor?.("bg_color");
}

export function applyTelegramTheme(): void {
  const webApp = getTelegramWebApp();
  if (!webApp || !hasTelegramThemeContext()) {
    return;
  }

  const colorScheme = webApp.colorScheme === "dark" ? "dark" : "light";
  applyThemeParams(webApp.themeParams ?? {}, colorScheme);
  syncTelegramChrome();
}

export function initTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (!webApp || !hasTelegramThemeContext()) {
    return;
  }

  applyTelegramTheme();
  webApp.onEvent?.("themeChanged", applyTelegramTheme);
  webApp.ready();
  webApp.expand();
}
