import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../profile.css";
import { ChevronRight, LogOut, Settings, User as UserIcon } from "lucide-react";
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
import { ProfileHero } from "./ProfileHero.tsx";
import { ProfileStatGrid } from "./ProfileStatGrid.tsx";
import { MemberProfileView } from "./MemberProfileView.tsx";

type Props = { session: AuthResponse };

function ProfileView({ session, stats, onSettings, onOpenMember }: Readonly<{
  session: AuthResponse;
  stats: Stats | null;
  onSettings: () => void;
  onOpenMember: (member: User) => void;
}>) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers()
      .then((u) => setMembers([...u].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setMembers([]));
  }, []);

  return (
    <section className="user-page">
      <ProfileHero
        name={session.userName}
        role={session.role}
        groupName={session.groupName}
        action={
          <button className="user-page__banner-gear" onClick={() => { hapticTabTap(); onSettings(); }} aria-label={t('userPage.headingSettings')}>
            <Settings size={24} />
          </button>
        }
      />

      <ProfileStatGrid userId={session.userId} stats={stats} />

      <div className="user-page__section">
        <p className="user-page__section-title">{t('userPage.sectionMembers')}</p>
        <div className="user-page__card">
          {members.map((m) => {
            const isSelf = m.id === session.userId;
            if (isSelf) {
              return (
                <div key={m.id} className="user-page__row user-page__member-row user-page__member-row--self">
                  <span className="user-page__member-main">
                    <span className="user-page__member-avatar"><UserIcon size={20} /></span>
                    <span className="user-page__row-label">{m.name} ({t('userPage.memberYou')})</span>
                  </span>
                </div>
              );
            }
            return (
              <div key={m.id}>
                <button
                  type="button"
                  className="user-page__row user-page__member-row"
                  onClick={() => { hapticTabTap(); onOpenMember(m); }}
                >
                  <span className="user-page__member-main">
                    <span className="user-page__member-avatar"><UserIcon size={20} /></span>
                    <span className="user-page__row-label">{m.name}</span>
                  </span>
                  <ChevronRight size={16} />
                </button>
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
      <div className="user-page__settings-header">
        <PageBackButton onBack={onBack} />
        <h2 className="page-title">{t('userPage.headingSettings')}</h2>
        <button
          type="button"
          className="user-page__logout-btn user-page__logout-circle"
          onClick={() => { hapticTabTap(); setConfirmingLogout(true); }}
          aria-label={t('userPage.btnSignOut')}
        >
          <LogOut size={18} />
        </button>
      </div>
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

const UserPage = ({ session }: Props) => {
  const [view, setView] = useState<"profile" | "settings">("profile");
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [viewingMember, setViewingMember] = useState<User | null>(null);
  const [memberOverlayEl, setMemberOverlayEl] = useState<HTMLDivElement | null>(null);
  const [viewingList, setViewingList] = useState(false);
  const [listOverlayEl, setListOverlayEl] = useState<HTMLDivElement | null>(null);
  const closeSettings = () => setView("profile");
  const closeMember = () => setViewingMember(null);
  const closeList = () => setViewingList(false);
  useSwipeBack(closeSettings, overlayEl);
  useSwipeBack(closeMember, memberOverlayEl);
  useSwipeBack(closeList, listOverlayEl);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <>
      <ProfileView
        session={session}
        stats={stats}
        onSettings={() => setView("settings")}
        onOpenMember={(member) => { setViewingList(false); setViewingMember(member); }}
      />
      {view === "settings" && (
        <div className="user-page__settings-overlay" ref={setOverlayEl}>
          <SettingsView session={session} onBack={closeSettings} />
        </div>
      )}
      {viewingMember && (
        <div className="user-page__settings-overlay" ref={setMemberOverlayEl}>
          <MemberProfileView
            member={viewingMember}
            groupName={session.groupName}
            stats={stats}
            onBack={closeMember}
            onOpenList={() => setViewingList(true)}
          />
        </div>
      )}
      {viewingMember && viewingList && (
        <div className="user-page__settings-overlay" ref={setListOverlayEl}>
          <MemberListPage
            targetUserId={viewingMember.id}
            targetName={viewingMember.name}
            onBack={closeList}
          />
        </div>
      )}
    </>
  );
};

export default UserPage;
