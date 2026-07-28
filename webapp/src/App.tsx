import { useEffect, useRef, useState } from "react";
import GroupListPage from "@/features/group/components/GroupListPage.tsx";
import StatPage from "@/features/stats/components/StatPage.tsx";
import PersonalStatPage from "@/features/personal/components/PersonalStatPage.tsx";
import UserPage from "@/features/profile/components/UserPage.tsx";
import PersonalListPage from "@/features/personal/components/PersonalListPage.tsx";
import { AuthGate } from "@/features/auth/components/AuthGate.tsx";
import type { AuthResponse } from "@/features/auth/api/auth.ts";
import { OnboardingModal } from "@/features/onboarding/components/OnboardingModal.tsx";
import SearchResults from "@/features/search/components/SearchResults.tsx";
import { SearchInput } from "@/components/SearchInput.tsx";
import { CircleUser, Film, Search, Users } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useTranslation } from "react-i18next";
import { useNavDrag } from "@/hooks/useNavDrag.ts";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset.ts";
import { getKeyboardViewportHeight, onKeyboardViewportChange } from "@/hooks/useTelegramKeyboard.ts";

type Tab = "group" | "personal" | "misc";
type Page = Tab | "stat" | "personalStat";
type NavId = Tab | "search";

const SEARCH_NAV_INDEX = 3;
const SEARCH_CLOSE_MS = 300;

const TABS: Array<{ id: NavId; labelKey: string; icon: React.ReactNode }> = [
  { id: "group", labelKey: "nav.groupList", icon: <Users size={30} /> },
  { id: "personal", labelKey: "nav.personalList", icon: <Film size={30} /> },
  { id: "misc", labelKey: "nav.profile", icon: <CircleUser size={30} /> },
  { id: "search", labelKey: "nav.search", icon: <Search size={30} /> },
];

function AppShell({ session: initialSession }: Readonly<{ session: AuthResponse }>) {
  const { t } = useTranslation();
  const [session, setSession] = useState(initialSession);
  const defaultTab: Tab = session.defaultPage === "watchlist" ? "personal" : "group";
  const [currentPage, setCurrentPage] = useState<Page>(defaultTab);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [groupResetSignal, setGroupResetSignal] = useState(0);
  const [personalResetSignal, setPersonalResetSignal] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResetSignal, setSearchResetSignal] = useState(0);
  const [searchDetailOpen, setSearchDetailOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const searchCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdmin = session.role === "admin";
  const keyboardOffset = useKeyboardOffset(searchOpen && !searchDetailOpen && !searchClosing);

  useEffect(() => () => {
    if (searchCloseTimerRef.current) clearTimeout(searchCloseTimerRef.current);
  }, []);

  useEffect(() => {
    const isTextEntry = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    const onFocusIn = (e: FocusEvent) => { if (isTextEntry(e.target)) setKeyboardOpen(true); };
    const onFocusOut = (e: FocusEvent) => { if (isTextEntry(e.target)) setKeyboardOpen(false); };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let maxHeight = getKeyboardViewportHeight() ?? 0;
    const onViewportChange = () => {
      const height = getKeyboardViewportHeight();
      if (height === undefined) return;
      maxHeight = Math.max(maxHeight, height);
      if (height < maxHeight - 100 && isTextEntry(document.activeElement)) {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = undefined; }
        setKeyboardOpen(true);
      } else if (!isTextEntry(document.activeElement)) {
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          if (!isTextEntry(document.activeElement)) setKeyboardOpen(false);
        }, 300);
      }
    };
    const unsubscribe = onKeyboardViewportChange(onViewportChange);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      unsubscribe();
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, []);

  const searchShowingResults = searchOpen && searchQuery.length > 0;
  const rawTabIndex = TABS.findIndex((tab) => tab.id === (currentPage as NavId));
  const fallbackTab = currentPage === "personalStat" ? "personal" : "group";
  const pageTabIndex = rawTabIndex === -1 ? TABS.findIndex((tab) => tab.id === fallbackTab) : rawTabIndex;
  const currentTabIndex = searchOpen ? SEARCH_NAV_INDEX : pageTabIndex;

  const closeSearch = () => {
    if (searchClosing) return;
    setSearchClosing(true);
    searchCloseTimerRef.current = setTimeout(() => {
      setSearchOpen(false);
      setSearchClosing(false);
      setSearchQuery("");
      setSearchResetSignal((n) => n + 1);
    }, SEARCH_CLOSE_MS);
  };

  const selectTab = (tab: NavId) => {
    hapticTabTap();
    if (tab === "search") {
      if (searchOpen) {
        closeSearch();
        return;
      }
      setSearchOpen(true);
      return;
    }
    if (searchOpen) closeSearch();
    if (tab === currentPage) {
      if (tab === "group") setGroupResetSignal((n) => n + 1);
      if (tab === "personal") setPersonalResetSignal((n) => n + 1);
    }
    setCurrentPage(tab);
  };

  const { navRef, indicatorRef } = useNavDrag(TABS.length, currentTabIndex, (idx) => {
    selectTab(TABS[idx].id);
  });

  if (!session.groupId) {
    return (
      <OnboardingModal
        onGroupReady={(groupId, groupName) => setSession((prev) => ({ ...prev, groupId, groupName }))}
      />
    );
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <div hidden={searchShowingResults || (currentPage !== "group" && currentPage !== "stat")}><GroupListPage isAdmin={isAdmin} currentUserId={session.userId} onShowStats={() => setCurrentPage("stat")} resetSignal={groupResetSignal} /></div>
        <div hidden={searchShowingResults || currentPage !== "stat"}><StatPage active={!searchShowingResults && currentPage === "stat"} onBack={() => setCurrentPage("group")} /></div>
        <div hidden={searchShowingResults || (currentPage !== "personal" && currentPage !== "personalStat")}><PersonalListPage active={!searchShowingResults && currentPage === "personal"} onShowStats={() => setCurrentPage("personalStat")} resetSignal={personalResetSignal} /></div>
        <div hidden={searchShowingResults || currentPage !== "personalStat"}><PersonalStatPage active={!searchShowingResults && currentPage === "personalStat"} onBack={() => setCurrentPage("personal")} /></div>
        <div hidden={searchShowingResults || currentPage !== "misc"}><UserPage session={session} /></div>
        <div hidden={!searchShowingResults}>
          <SearchResults
            query={searchQuery}
            active={searchOpen}
            currentUserId={session.userId}
            resetSignal={searchResetSignal}
            onDetailOpenChange={setSearchDetailOpen}
          />
        </div>
      </main>
      {searchOpen && !searchDetailOpen && (
        <SearchInput
          closing={searchClosing}
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('search.placeholder')}
          cancelLabel={t('search.cancel')}
          onCancel={closeSearch}
          keyboardOffset={keyboardOffset}
        />
      )}
      <nav ref={navRef} className={`bottom-bar${keyboardOpen || (searchOpen && !searchClosing) ? " bottom-bar--hidden" : ""}`}>
        <span ref={indicatorRef} className="bottom-bar__indicator" aria-hidden="true" />
        {TABS.map(({ id, labelKey, icon }, idx) => {
          const isActive = idx === currentTabIndex;
          return (
            <button
              key={id}
              className={`bottom-bar-button${isActive ? " active" : ""}`}
              aria-label={t(labelKey)}
              aria-current={isActive ? "page" : undefined}
              onClick={() => selectTab(id)}
            >
              {icon}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function App() {
  return (
    <AuthGate>
      {(session) => <AppShell session={session} />}
    </AuthGate>
  );
}

export default App;
