import { useState } from "react";
import { hapticTabTap } from "../haptics.ts";
import { applyColorScheme } from "../telegramTheme.ts";
import { savePreferences } from "../api/users.ts";

type MiscPageProps = { savedTheme?: "dark" | "light" | null; savedDefaultPage?: "list" | "watchlist" | null };

const MiscPage = ({ savedTheme, savedDefaultPage }: MiscPageProps) => {
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.colorScheme === "dark");
  const [persistedDark, setPersistedDark] = useState(() =>
    savedTheme != null ? savedTheme === "dark" : document.documentElement.dataset.colorScheme === "dark"
  );
  const [defaultPage, setDefaultPage] = useState<"list" | "watchlist">(savedDefaultPage ?? "list");
  const [persistedDefaultPage, setPersistedDefaultPage] = useState<"list" | "watchlist">(savedDefaultPage ?? "list");
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = isDark !== persistedDark || defaultPage !== persistedDefaultPage;

  return <section className="misc-page">
    <div className="misc-page__section">
      <h3 className="misc-page__section-title">Homepage</h3>
      <div className="misc-page__card misc-page__default-page-row">
        <button
          type="button"
          className={`misc-page__page-btn${defaultPage === "list" ? " misc-page__page-btn--active" : ""}`}
          onClick={() => { hapticTabTap(); setDefaultPage("list"); }}
        >
          Group Movie List
        </button>
        <button
          type="button"
          className={`misc-page__page-btn${defaultPage === "watchlist" ? " misc-page__page-btn--active" : ""}`}
          onClick={() => { hapticTabTap(); setDefaultPage("watchlist"); }}
        >
          Personal Movie List
        </button>
      </div>
    </div>
    <div className="misc-page__section">
      <h3 className="misc-page__section-title">Appearance</h3>
      <div className="misc-page__card misc-page__theme-row">
        <span className="misc-page__label" style={{margin: 0}}>Dark Mode</span>
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
    </div>
  </section>;
};

export default MiscPage;
