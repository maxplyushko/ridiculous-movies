import { useState, type ReactNode } from "react";
import GroupListPage from "@/features/group/components/GroupListPage.tsx";
import StatPage from "@/features/stats/components/StatPage.tsx";
import PersonalStatPage from "@/features/personal/components/PersonalStatPage.tsx";
import UserPage from "@/features/profile/components/UserPage.tsx";
import PersonalListPage from "@/features/personal/components/PersonalListPage.tsx";
import { AuthGate } from "@/features/auth/components/AuthGate.tsx";
import type { AuthResponse } from "@/features/auth/api/auth.ts";
import { OnboardingModal } from "@/features/onboarding/components/OnboardingModal.tsx";
import SearchResults from "@/features/search/components/SearchResults.tsx";
import { CircleUser, Film, Search, Users } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useTranslation } from "react-i18next";
import { useNavDrag } from "@/hooks/useNavDrag.ts";
import { useKeyboardOpenClass } from "@/hooks/useTelegramKeyboard.ts";

type Tab = "group" | "personal" | "misc" | "search";
type Page = Tab | "stat" | "personalStat";

const TABS: Array<{ id: Tab; labelKey: string; icon: ReactNode }> = [
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
  const [groupResetSignal, setGroupResetSignal] = useState(0);
  const [personalResetSignal, setPersonalResetSignal] = useState(0);
  const [miscResetSignal, setMiscResetSignal] = useState(0);
  const [searchResetSignal, setSearchResetSignal] = useState(0);
  const isAdmin = session.role === "admin";

  const selectTab = (tab: Tab) => {
    hapticTabTap();
    if (tab === currentPage) {
      if (tab === "group") setGroupResetSignal((n) => n + 1);
      if (tab === "personal") setPersonalResetSignal((n) => n + 1);
      if (tab === "misc") setMiscResetSignal((n) => n + 1);
      if (tab === "search") setSearchResetSignal((n) => n + 1);
    }
    setCurrentPage(tab);
  };

  const rawTabIndex = TABS.findIndex((tab) => tab.id === (currentPage as Tab));
  const fallbackTab = currentPage === "personalStat" ? "personal" : "group";
  const currentTabIndex = rawTabIndex === -1 ? TABS.findIndex((tab) => tab.id === fallbackTab) : rawTabIndex;
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
        <div hidden={currentPage !== "group" && currentPage !== "stat"}><GroupListPage isAdmin={isAdmin} currentUserId={session.userId} onShowStats={() => setCurrentPage("stat")} resetSignal={groupResetSignal} /></div>
        <div hidden={currentPage !== "stat"}><StatPage active={currentPage === "stat"} onBack={() => setCurrentPage("group")} /></div>
        <div hidden={currentPage !== "personal" && currentPage !== "personalStat"}><PersonalListPage active={currentPage === "personal"} onShowStats={() => setCurrentPage("personalStat")} resetSignal={personalResetSignal} /></div>
        <div hidden={currentPage !== "personalStat"}><PersonalStatPage active={currentPage === "personalStat"} onBack={() => setCurrentPage("personal")} /></div>
        <div hidden={currentPage !== "misc"}><UserPage session={session} resetSignal={miscResetSignal} /></div>
        <div hidden={currentPage !== "search"}><SearchResults currentUserId={session.userId} resetSignal={searchResetSignal} /></div>
      </main>
      <nav ref={navRef} className="bottom-bar">
        <span ref={indicatorRef} className="bottom-bar__indicator" aria-hidden="true" />
        {TABS.map(({ id, labelKey, icon }) => (
          <button
            key={id}
            type="button"
            className={`bottom-bar-button${(currentPage === id || (currentPage === "stat" && id === "group") || (currentPage === "personalStat" && id === "personal")) ? " active" : ""}`}
            aria-label={t(labelKey)}
            aria-current={(currentPage === id || (currentPage === "stat" && id === "group") || (currentPage === "personalStat" && id === "personal")) ? "page" : undefined}
            onClick={() => selectTab(id)}
          >
            {icon}
          </button>
        ))}
      </nav>
    </div>
  );
}

function App() {
  useKeyboardOpenClass();
  return (
      <AuthGate>
        {(session) => <AppShell session={session} />}
      </AuthGate>
  );
}

export default App;
