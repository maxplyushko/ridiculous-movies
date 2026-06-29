import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LogOut, Settings } from "lucide-react";
import { hapticTabTap } from "../haptics.ts";
import { applyColorScheme } from "../telegramTheme.ts";
import { savePreferences } from "../api/users.ts";
import { tokenStore } from "../api/client.ts";
import type { AuthResponse } from "../api/auth.ts";
import i18n from "../i18n/index.ts";

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
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.colorScheme === "dark");
  const [persistedDark, setPersistedDark] = useState(() =>
    session.theme != null ? session.theme === "dark" : document.documentElement.dataset.colorScheme === "dark"
  );
  const [defaultPage, setDefaultPage] = useState<"list" | "watchlist">(session.defaultPage ?? "list");
  const [persistedDefaultPage, setPersistedDefaultPage] = useState<"list" | "watchlist">(session.defaultPage ?? "list");
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = isDark !== persistedDark || defaultPage !== persistedDefaultPage;
  const currentLang = i18n.language;

  const changeLang = (lang: string) => {
    hapticTabTap();
    i18n.changeLanguage(lang);
    localStorage.setItem("i18n-lang", lang);
    savePreferences({ lang }).catch(() => {});
  };

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
            className={`user-page__seg-btn${currentLang === "en" ? " user-page__seg-btn--active" : ""}`}
            onClick={() => changeLang("en")}
          >
            English
          </button>
          <button
            type="button"
            className={`user-page__seg-btn${currentLang === "ru" ? " user-page__seg-btn--active" : ""}`}
            onClick={() => changeLang("ru")}
          >
            Русский
          </button>
        </div>
      </div>

      <div className="add-movie__control">
        <button type="button" onClick={() => { hapticTabTap(); onBack(); }}>{t('settings.btnBack')}</button>
        {isDirty && (
          <button
            type="button"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                await savePreferences({ theme: isDark ? "dark" : "light", defaultPage });
                setPersistedDark(isDark);
                setPersistedDefaultPage(defaultPage);
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

  return (
    <>
      <ProfileView session={session} onSettings={() => setView("settings")} />
      {view === "settings" && (
        <div className="user-page__settings-overlay">
          <SettingsView session={session} onBack={() => setView("profile")} />
        </div>
      )}
    </>
  );
};

export default UserPage;
