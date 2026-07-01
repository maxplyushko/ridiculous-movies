import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LogOut, Settings } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { applyColorScheme } from "@/lib/telegram/telegramTheme.ts";
import { savePreferences } from "@/features/group/api/users.ts";
import { tokenStore } from "@/api/client.ts";
import type { AuthResponse } from "@/features/auth/api/auth.ts";
import i18n from "@/lib/i18n/index.ts";
import { useTelegramBackButton } from "@/hooks/useTelegramButtons.ts";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";
import { isTelegramMiniApp } from "@/lib/telegram/telegram.ts";

type Props = { session: AuthResponse };

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfileView({ session, onSettings }: Readonly<{
  session: AuthResponse;
  onSettings: () => void
}>) {
  const { t } = useTranslation();

  const handleLogout = () => {
    hapticTabTap();
    tokenStore.clear();
    window.location.reload();
  };

  return (
    <section className="user-page">
      <div className="user-page__topbar">
        <button className="user-page__icon-btn" onClick={() => { hapticTabTap(); onSettings(); }} aria-label={t('userPage.headingSettings')}>
          <Settings size={20} />
        </button>
      </div>

      <div className="user-page__hero">
        <div className="user-page__avatar">
          <span className="user-page__initials">{getInitials(session.userName)}</span>
        </div>
        <h1 className="user-page__name">{session.userName}</h1>
        <div className="user-page__badges">
          <span className={`user-page__role-badge user-page__role-badge--${session.role}`}>
            {session.role === "admin" ? t('userPage.badgeAdmin') : t('userPage.badgeMember')}
          </span>
          <span className="user-page__role-badge user-page__role-badge--group">
            {session.groupName}
          </span>
        </div>
      </div>

      <div className="user-page__section user-page__section--danger">
        <button className="user-page__logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          {t('userPage.btnSignOut')}
        </button>
      </div>
    </section>
  );
}

function SettingsView({ session, onBack }: { session: AuthResponse; onBack: () => void }) {
  const { t } = useTranslation();
  const isTg = isTelegramMiniApp();
  useTelegramBackButton(onBack);
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.colorScheme === "dark");
  const [persistedDark, setPersistedDark] = useState(() =>
    session.theme != null ? session.theme === "dark" : document.documentElement.dataset.colorScheme === "dark"
  );
  const [defaultPage, setDefaultPage] = useState<"list" | "watchlist">(session.defaultPage ?? "list");
  const [persistedDefaultPage, setPersistedDefaultPage] = useState<"list" | "watchlist">(session.defaultPage ?? "list");
  const [selectedLang, setSelectedLang] = useState(() => i18n.language);
  const [persistedLang, setPersistedLang] = useState(() => session.lang ?? i18n.language);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = isDark !== persistedDark || defaultPage !== persistedDefaultPage || selectedLang !== persistedLang;

  return (
    <section className="user-page">
      <h2 className="user-page__topbar-title">{t('userPage.headingSettings')}</h2>

      <div className="user-page__section">
        <p className="user-page__section-title">{t('settings.sectionHomepage')}</p>
        <div className="user-page__card user-page__segmented-row">
          <button
            type="button"
            className={`user-page__seg-btn${defaultPage === "list" ? " user-page__seg-btn--active" : ""}`}
            onClick={() => { hapticTabTap(); setDefaultPage("list"); }}
          >
            {t('settings.btnGroupList')}
          </button>
          <button
            type="button"
            className={`user-page__seg-btn${defaultPage === "watchlist" ? " user-page__seg-btn--active" : ""}`}
            onClick={() => { hapticTabTap(); setDefaultPage("watchlist"); }}
          >
            {t('settings.btnPersonalList')}
          </button>
        </div>
      </div>

      <div className="user-page__section">
        <p className="user-page__section-title">{t('settings.sectionAppearance')}</p>
        <div className="user-page__card">
          <div className="user-page__row">
            <span className="user-page__row-label">{t('settings.labelDarkMode')}</span>
            <label className="theme-toggle" aria-label="Toggle dark mode">
              <input
                type="checkbox"
                checked={isDark}
                onChange={(e) => {
                  const dark = e.target.checked;
                  setIsDark(dark);
                  applyColorScheme(dark);
                }}
              />
              <span className="theme-toggle__track" />
            </label>
          </div>
        </div>
      </div>

      <div className="user-page__section">
        <p className="user-page__section-title">{t('settings.sectionLanguage')}</p>
        <div className="user-page__card user-page__segmented-row">
          <button
            type="button"
            className={`user-page__seg-btn${selectedLang === "en" ? " user-page__seg-btn--active" : ""}`}
            onClick={() => { hapticTabTap(); setSelectedLang("en"); i18n.changeLanguage("en"); }}
          >
            English
          </button>
          <button
            type="button"
            className={`user-page__seg-btn${selectedLang === "ru" ? " user-page__seg-btn--active" : ""}`}
            onClick={() => { hapticTabTap(); setSelectedLang("ru"); i18n.changeLanguage("ru"); }}
          >
            Русский
          </button>
        </div>
      </div>

      <div className="add-movie__control">
        {!isTg && <button type="button" onClick={() => { hapticTabTap(); onBack(); }}>{t('settings.btnBack')}</button>}
        {isDirty && (
          <button
            type="button"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                await savePreferences({ theme: isDark ? "dark" : "light", defaultPage, lang: selectedLang });
                localStorage.setItem("i18n-lang", selectedLang);
                setPersistedDark(isDark);
                setPersistedDefaultPage(defaultPage);
                setPersistedLang(selectedLang);
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? t('settings.btnSaving') : t('settings.btnSave')}
          </button>
        )}
      </div>
    </section>
  );
}

const UserPage = ({ session }: Props) => {
  const [view, setView] = useState<"profile" | "settings">("profile");
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const closeSettings = () => setView("profile");
  useSwipeBack(closeSettings, overlayEl);

  return (
    <>
      <ProfileView session={session} onSettings={() => setView("settings")} />
      {view === "settings" && (
        <div className="user-page__settings-overlay" ref={setOverlayEl}>
          <SettingsView session={session} onBack={closeSettings} />
        </div>
      )}
    </>
  );
};

export default UserPage;
