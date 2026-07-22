import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../profile.css";
import { ChevronRight, Clapperboard, Lock, LogOut, Settings, Star, TrendingUp, Trophy, User as UserIcon } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { applyColorScheme } from "@/lib/telegram/telegramTheme.ts";
import { fetchUsers, savePreferences } from "@/features/group/api/users.ts";
import { fetchStats } from "@/features/stats/api/stats.ts";
import type { Stats } from "@/features/stats/types/Stat.ts";
import type { User } from "@/types/User.ts";
import { tokenStore } from "@/api/client.ts";
import { AsyncButton } from "@/components/AsyncButton.tsx";
import type { AuthResponse } from "@/features/auth/api/auth.ts";
import i18n from "@/lib/i18n/index.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.tsx";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";
import { setTmdbLang } from "@/utils/tmdbLang.ts";
import MemberListPage from "@/features/personal/components/MemberListPage.tsx";

type Props = { session: AuthResponse; onOpenPersonalTab: () => void };

function ProfileView({ session, onSettings, onOpenPersonalTab, onOpenMember }: Readonly<{
  session: AuthResponse;
  onSettings: () => void;
  onOpenPersonalTab: () => void;
  onOpenMember: (id: string, name: string) => void;
}>) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [lockedNoticeId, setLockedNoticeId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers().then(setMembers).catch(() => setMembers([]));
    fetchStats().then(setStats).catch(() => setStats(null));
  }, []);

  const selfRating = stats?.usersByRating.find((u) => u.id === session.userId) ?? null;
  const hostRank = stats && selfRating?.averageRatingAsHost != null
    ? [...stats.usersByRating]
        .filter((u) => u.averageRatingAsHost != null)
        .sort((a, b) => (b.averageRatingAsHost ?? 0) - (a.averageRatingAsHost ?? 0))
        .findIndex((u) => u.id === session.userId) + 1
    : 0;

  return (
    <section className="user-page">
      <div className="user-page__hero">
        <div className="user-page__banner">
          <button className="user-page__banner-gear" onClick={() => { hapticTabTap(); onSettings(); }} aria-label={t('userPage.headingSettings')}>
            <Settings size={24} />
          </button>
          <UserIcon size={190} strokeWidth={1.25} className="user-page__banner-avatar" />
        </div>
        <div className="user-page__identity">
          <div className="user-page__identity-head">
            <h1 className="user-page__name">{session.userName}</h1>
          </div>
          <p className="user-page__subtitle">
            <span className={`user-page__role-badge user-page__role-badge--${session.role}`}>
              {session.role === "admin" ? t('userPage.badgeAdmin') : t('userPage.badgeMember')}
            </span>
            <span className="user-page__subtitle-group">{session.groupName}</span>
          </p>
        </div>
      </div>

      <div className="user-page__section">
        <p className="user-page__section-title">{t('userPage.sectionStats')}</p>
        <div className="user-page__stat-grid">
          <div className="user-page__stat-tile">
            <span className="user-page__stat-icon user-page__stat-icon--amber"><Star size={20} /></span>
            <div className="user-page__stat-body">
              <span className="user-page__stat-value">{selfRating ? selfRating.ratingCount : "—"}</span>
              <span className="user-page__stat-label">{t('userPage.statMoviesRated')}</span>
            </div>
          </div>
          <div className="user-page__stat-tile">
            <span className="user-page__stat-icon user-page__stat-icon--green"><TrendingUp size={20} /></span>
            <div className="user-page__stat-body">
              <span className="user-page__stat-value">{selfRating?.averageRatingGiven != null ? selfRating.averageRatingGiven.toFixed(1) : "—"}</span>
              <span className="user-page__stat-label">{t('userPage.statAvgGiven')}</span>
            </div>
          </div>
          <div className="user-page__stat-tile">
            <span className="user-page__stat-icon user-page__stat-icon--blue"><Clapperboard size={20} /></span>
            <div className="user-page__stat-body">
              <span className="user-page__stat-value">{selfRating?.averageRatingAsHost != null ? selfRating.averageRatingAsHost.toFixed(1) : "—"}</span>
              <span className="user-page__stat-label">{t('userPage.statAvgAsHost')}</span>
            </div>
          </div>
          <div className="user-page__stat-tile">
            <span className="user-page__stat-icon user-page__stat-icon--purple"><Trophy size={20} /></span>
            <div className="user-page__stat-body">
              <span className="user-page__stat-value">{hostRank > 0 ? `#${hostRank}` : "—"}</span>
              <span className="user-page__stat-label">{t('userPage.statHostRank')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="user-page__section">
        <p className="user-page__section-title">{t('userPage.sectionMembers')}</p>
        <div className="user-page__card">
          {members.map((m) => {
            const isSelf = m.id === session.userId;
            const locked = !isSelf && !m.personalListPublic;
            return (
              <div key={m.id}>
                <button
                  type="button"
                  className="user-page__row user-page__member-row"
                  onClick={() => {
                    hapticTabTap();
                    if (isSelf) { onOpenPersonalTab(); return; }
                    if (locked) { setLockedNoticeId((cur) => (cur === m.id ? null : m.id)); return; }
                    onOpenMember(m.id, m.name);
                  }}
                >
                  <span className="user-page__row-label">
                    {m.name}{isSelf ? ` (${t('userPage.memberYou')})` : ""}
                  </span>
                  {locked ? <Lock size={16} /> : <ChevronRight size={16} />}
                </button>
                {lockedNoticeId === m.id && (
                  <p className="user-page__member-note">{t('userPage.memberPrivate')}</p>
                )}
              </div>
            );
          })}
        </div>
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
  const [selectedLang, setSelectedLang] = useState(() => i18n.language);
  const [persistedLang, setPersistedLang] = useState(() => session.lang ?? i18n.language);
  const [selectedTmdbLang, setSelectedTmdbLang] = useState<"ru" | "en">(session.tmdbLang ?? "ru");
  const [persistedTmdbLang, setPersistedTmdbLang] = useState<"ru" | "en">(session.tmdbLang ?? "ru");
  const [isPublic, setIsPublic] = useState(session.personalListPublic ?? true);
  const [persistedPublic, setPersistedPublic] = useState(session.personalListPublic ?? true);
  const isDirty = isDark !== persistedDark || defaultPage !== persistedDefaultPage
    || selectedLang !== persistedLang || selectedTmdbLang !== persistedTmdbLang
    || isPublic !== persistedPublic;

  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const handleLogout = () => {
    hapticTabTap();
    tokenStore.clear();
    window.location.reload();
  };

  return (
    <section className="user-page">
      <PageBackButton onBack={onBack} />
      <button
        type="button"
        className="user-page__logout-btn user-page__logout-circle"
        onClick={() => { hapticTabTap(); setConfirmingLogout(true); }}
        aria-label={t('userPage.btnSignOut')}
      >
        <LogOut size={18} />
      </button>
      {confirmingLogout && (
        <ConfirmDialog
          message={t('userPage.confirmLogout')}
          error={null}
          isLoading={false}
          cancelLabel={t('userPage.btnNo')}
          confirmLabel={t('userPage.btnYes')}
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={handleLogout}
        />
      )}
      <h2 className="page-title">{t('userPage.headingSettings')}</h2>

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
        <div className="user-page__card">
          <p className="user-page__field-label">{t('settings.sectionLanguage')}</p>
          <div className="user-page__segmented-row">
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
        <div className="user-page__card">
          <p className="user-page__field-label">{t('settings.sectionTmdbLang')}</p>
          <div className="user-page__segmented-row">
            <button
              type="button"
              className={`user-page__seg-btn${selectedTmdbLang === "en" ? " user-page__seg-btn--active" : ""}`}
              onClick={() => { hapticTabTap(); setSelectedTmdbLang("en"); }}
            >
              English
            </button>
            <button
              type="button"
              className={`user-page__seg-btn${selectedTmdbLang === "ru" ? " user-page__seg-btn--active" : ""}`}
              onClick={() => { hapticTabTap(); setSelectedTmdbLang("ru"); }}
            >
              Русский
            </button>
          </div>
        </div>
      </div>

      <div className="user-page__section">
        <p className="user-page__section-title">{t('settings.sectionPrivacy')}</p>
        <div className="user-page__card">
          <div className="user-page__row">
            <span className="user-page__row-label">{t('settings.labelPublicList')}</span>
            <label className="theme-toggle" aria-label={t('settings.labelPublicList')}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => { hapticTabTap(); setIsPublic(e.target.checked); }}
              />
              <span className="theme-toggle__track" />
            </label>
          </div>
        </div>
      </div>

      <div className="add-movie__control">
        {isDirty && (
          <AsyncButton
            type="button"
            onClick={async () => {
              await savePreferences({ theme: isDark ? "dark" : "light", defaultPage, lang: selectedLang, tmdbLang: selectedTmdbLang, personalListPublic: isPublic });
              localStorage.setItem("i18n-lang", selectedLang);
              setTmdbLang(selectedTmdbLang);
              setPersistedDark(isDark);
              setPersistedDefaultPage(defaultPage);
              setPersistedLang(selectedLang);
              setPersistedTmdbLang(selectedTmdbLang);
              setPersistedPublic(isPublic);
            }}
          >
            {t('settings.btnSave')}
          </AsyncButton>
        )}
      </div>
    </section>
  );
}

const UserPage = ({ session, onOpenPersonalTab }: Props) => {
  const [view, setView] = useState<"profile" | "settings">("profile");
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const [viewingMember, setViewingMember] = useState<{ id: string; name: string } | null>(null);
  const [memberOverlayEl, setMemberOverlayEl] = useState<HTMLDivElement | null>(null);
  const closeSettings = () => setView("profile");
  const closeMember = () => setViewingMember(null);
  useSwipeBack(closeSettings, overlayEl);
  useSwipeBack(closeMember, memberOverlayEl);

  return (
    <>
      <ProfileView
        session={session}
        onSettings={() => setView("settings")}
        onOpenPersonalTab={onOpenPersonalTab}
        onOpenMember={(id, name) => setViewingMember({ id, name })}
      />
      {view === "settings" && (
        <div className="user-page__settings-overlay" ref={setOverlayEl}>
          <SettingsView session={session} onBack={closeSettings} />
        </div>
      )}
      {viewingMember && (
        <div className="user-page__settings-overlay" ref={setMemberOverlayEl}>
          <MemberListPage
            targetUserId={viewingMember.id}
            targetName={viewingMember.name}
            onBack={closeMember}
          />
        </div>
      )}
    </>
  );
};

export default UserPage;
