import { useState } from "react";
import { ArrowLeft, LogOut, Settings } from "lucide-react";
import { hapticTabTap } from "../haptics.ts";
import { applyColorScheme } from "../telegramTheme.ts";
import { savePreferences } from "../api/users.ts";
import { tokenStore } from "../api/client.ts";
import type { AuthResponse } from "../api/auth.ts";

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
  const handleLogout = () => {
    hapticTabTap();
    tokenStore.clear();
    window.location.reload();
  };

  return (
    <section className="user-page">
      <div className="user-page__topbar">
        <button className="user-page__icon-btn" onClick={() => { hapticTabTap(); onSettings(); }} aria-label="Settings">
          <Settings size={20} />
        </button>
      </div>

      <div className="user-page__hero">
        <div className="user-page__avatar">
          <span className="user-page__initials">{getInitials(session.userName)}</span>
        </div>
        <h1 className="user-page__name">{session.userName}</h1>
        <span className={`user-page__role-badge user-page__role-badge--${session.role}`}>
          {session.role === "admin" ? "Admin" : "Member"}
        </span>
      </div>

      <div className="user-page__section">
        <p className="user-page__section-title">Account</p>
        <div className="user-page__card">
          <div className="user-page__row">
            <span className="user-page__row-label">Group</span>
            <span className="user-page__row-value">{session.groupName}</span>
          </div>
        </div>
      </div>

      <div className="user-page__section user-page__section--danger">
        <button className="user-page__logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </section>
  );
}

function SettingsView({ session, onBack }: { session: AuthResponse; onBack: () => void }) {
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.colorScheme === "dark");
  const [persistedDark, setPersistedDark] = useState(() =>
    session.theme != null ? session.theme === "dark" : document.documentElement.dataset.colorScheme === "dark"
  );
  const [defaultPage, setDefaultPage] = useState<"list" | "watchlist">(session.defaultPage ?? "list");
  const [persistedDefaultPage, setPersistedDefaultPage] = useState<"list" | "watchlist">(session.defaultPage ?? "list");
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = isDark !== persistedDark || defaultPage !== persistedDefaultPage;

  return (
    <section className="user-page">
      <div className="user-page__topbar user-page__topbar--back">
        <button className="user-page__icon-btn" onClick={() => { hapticTabTap(); onBack(); }} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h2 className="user-page__topbar-title">Settings</h2>
      </div>

      <div className="user-page__section">
        <p className="user-page__section-title">Homepage</p>
        <div className="user-page__card user-page__segmented-row">
          <button
            type="button"
            className={`user-page__seg-btn${defaultPage === "list" ? " user-page__seg-btn--active" : ""}`}
            onClick={() => { hapticTabTap(); setDefaultPage("list"); }}
          >
            Group List
          </button>
          <button
            type="button"
            className={`user-page__seg-btn${defaultPage === "watchlist" ? " user-page__seg-btn--active" : ""}`}
            onClick={() => { hapticTabTap(); setDefaultPage("watchlist"); }}
          >
            Personal List
          </button>
        </div>
      </div>

      <div className="user-page__section">
        <p className="user-page__section-title">Appearance</p>
        <div className="user-page__card">
          <div className="user-page__row">
            <span className="user-page__row-label">Dark Mode</span>
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

      {isDirty && (
        <button
          type="button"
          className="misc-page__save-btn"
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
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      )}
    </section>
  );
}

const UserPage = ({ session }: Props) => {
  const [view, setView] = useState<"profile" | "settings">("profile");

  return view === "profile"
    ? <ProfileView session={session} onSettings={() => setView("settings")} />
    : <SettingsView session={session} onBack={() => setView("profile")} />;
};

export default UserPage;
