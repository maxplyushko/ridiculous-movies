import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import "../profile.css";
import { Check, ChevronRight, Copy, Link as LinkIcon, LogOut, Settings, User as UserIcon } from "lucide-react";
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
import { PAGE_EXIT_MS, Presence } from "@/components/Presence.tsx";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";
import { useRegisterSubPage } from "@/hooks/useSubPage.ts";
import { setTmdbLang } from "@/utils/tmdbLang.ts";
import { getInviteLink } from "@/features/onboarding/api/onboarding.ts";
import { buildInviteLinks } from "@/features/onboarding/inviteLink.ts";
import { isTelegramMiniApp } from "@/lib/telegram/telegram.ts";
import MemberListPage from "@/features/personal/components/MemberListPage.tsx";
import { ProfileHero } from "./ProfileHero.tsx";
import { ProfileStatGrid } from "./ProfileStatGrid.tsx";
import { MemberProfileView } from "./MemberProfileView.tsx";

type Props = { session: AuthResponse; resetSignal?: number };

function InviteLinkDialog({ onClose }: Readonly<{ onClose: () => void }>) {
  const { t } = useTranslation();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getInviteLink()
      .then((res) => setInviteCode(res.inviteCode))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const handleCopy = async () => {
    if (!inviteCode) return;
    hapticTabTap();
    const links = buildInviteLinks(inviteCode);
    const link = isTelegramMiniApp() && links.telegram ? links.telegram : links.web;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p>{t('userPage.inviteDialogHint')}</p>
        {error && <span className="confirm-dialog__error">{error}</span>}
        {inviteCode && (
          <div className="onboarding__invite-row">
            <code className="onboarding__invite-code">{inviteCode}</code>
            <button type="button" className="onboarding__copy-btn" onClick={handleCopy} aria-label={t('userPage.btnCopyInvite')}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        )}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={() => { hapticTabTap(); onClose(); }}>{t('onboarding.btnOk')}</button>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ session, stats, onSettings, onOpenMember }: Readonly<{
  session: AuthResponse;
  stats: Stats | null;
  onSettings: () => void;
  onOpenMember: (member: User) => void;
}>) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<User[]>([]);
  const [showInvite, setShowInvite] = useState(false);

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
        groupName={session.groupName ?? ""}
        groupAction={session.role === "admin" && (
          <button
            type="button"
            className="user-page__invite-link-btn"
            onClick={() => { hapticTabTap(); setShowInvite(true); }}
            aria-label={t('userPage.btnInviteLink')}
          >
            <LinkIcon size={16} />
          </button>
        )}
        action={
          <button className="user-page__banner-gear" onClick={() => { hapticTabTap(); onSettings(); }} aria-label={t('userPage.headingSettings')}>
            <Settings size={20} />
          </button>
        }
      />
      <Presence show={showInvite}>
        {showInvite && <InviteLinkDialog onClose={() => setShowInvite(false)} />}
      </Presence>

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

function SettingsView({ session, onBack, dirtyRef, discardRef }: {
  session: AuthResponse;
  onBack: () => void;
  dirtyRef: MutableRefObject<boolean>;
  discardRef: MutableRefObject<(() => void) | null>;
}) {
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

  useEffect(() => {
    dirtyRef.current = isDirty;
    discardRef.current = () => {
      setIsDark(persistedDark);
      applyColorScheme(persistedDark);
      setDefaultPage(persistedDefaultPage);
      setSelectedLang(persistedLang);
      i18n.changeLanguage(persistedLang);
      setSelectedTmdbLang(persistedTmdbLang);
      setIsPublic(persistedPublic);
    };
  });

  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const handleLogout = () => {
    hapticTabTap();
    tokenStore.markLoggedOut();
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
          <LogOut size={20} />
        </button>
      </div>
      <Presence show={confirmingLogout}>
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
      </Presence>

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
            <label className="theme-toggle" aria-label={t('settings.labelDarkMode')}>
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

const UserPage = ({ session, resetSignal }: Props) => {
  const { t } = useTranslation();
  const [view, setView] = useState<"profile" | "settings">("profile");
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [viewingMember, setViewingMember] = useState<User | null>(null);
  const [memberOverlayEl, setMemberOverlayEl] = useState<HTMLDivElement | null>(null);
  const [viewingList, setViewingList] = useState(false);
  const [listOverlayEl, setListOverlayEl] = useState<HTMLDivElement | null>(null);
  const settingsDirtyRef = useRef(false);
  const settingsDiscardRef = useRef<(() => void) | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  useRegisterSubPage(view === "settings" || viewingMember !== null || viewingList);

  const closeSettings = () => {
    settingsDirtyRef.current = false;
    settingsDiscardRef.current = null;
    setView("profile");
  };
  const requestCloseSettings = () => {
    if (settingsDirtyRef.current) {
      setConfirmingDiscard(true);
      return;
    }
    closeSettings();
  };
  const cancelDiscard = () => {
    hapticTabTap();
    setConfirmingDiscard(false);
    if (overlayEl) {
      // eslint-disable-next-line react-hooks/immutability
      overlayEl.style.transition = "transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)";
      overlayEl.style.transform = "";
    }
  };
  const confirmDiscard = () => {
    hapticTabTap();
    settingsDiscardRef.current?.();
    setConfirmingDiscard(false);
    closeSettings();
  };
  const closeMember = () => setViewingMember(null);
  const closeList = () => setViewingList(false);
  useSwipeBack(requestCloseSettings, overlayEl);
  useSwipeBack(closeMember, memberOverlayEl);
  useSwipeBack(closeList, listOverlayEl);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    setViewingMember(null);
    setViewingList(false);
    requestCloseSettings();
  }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ProfileView
        session={session}
        stats={stats}
        onSettings={() => setView("settings")}
        onOpenMember={(member) => { setViewingList(false); setViewingMember(member); }}
      />
      <Presence show={view === "settings"} exitMs={PAGE_EXIT_MS}>
        {view === "settings" && (
          <div className="user-page__settings-overlay" ref={setOverlayEl}>
            <SettingsView
              session={session}
              onBack={requestCloseSettings}
              dirtyRef={settingsDirtyRef}
              discardRef={settingsDiscardRef}
            />
          </div>
        )}
      </Presence>
      <Presence show={confirmingDiscard}>
        {confirmingDiscard && (
          <ConfirmDialog
            message={t('settings.confirmDiscard')}
            error={null}
            isLoading={false}
            cancelLabel={t('userPage.btnNo')}
            confirmLabel={t('userPage.btnYes')}
            onCancel={cancelDiscard}
            onConfirm={confirmDiscard}
          />
        )}
      </Presence>
      <Presence show={viewingMember !== null} exitMs={PAGE_EXIT_MS}>
        {viewingMember && (
          <div className="user-page__settings-overlay" ref={setMemberOverlayEl}>
            <MemberProfileView
              member={viewingMember}
              groupName={session.groupName ?? ""}
              stats={stats}
              onBack={closeMember}
              onOpenList={() => setViewingList(true)}
            />
          </div>
        )}
      </Presence>
      <Presence show={viewingMember !== null && viewingList} exitMs={PAGE_EXIT_MS}>
        {viewingMember && viewingList && (
          <div className="user-page__settings-overlay" ref={setListOverlayEl}>
            <MemberListPage
              targetUserId={viewingMember.id}
              targetName={viewingMember.name}
              onBack={closeList}
            />
          </div>
        )}
      </Presence>
    </>
  );
};

export default UserPage;
