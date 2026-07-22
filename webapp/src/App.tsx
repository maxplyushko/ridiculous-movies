import { useEffect, useState } from "react";
import GroupListPage from "@/features/group/components/GroupListPage.tsx";
import StatPage from "@/features/stats/components/StatPage.tsx";
import PersonalStatPage from "@/features/personal/components/PersonalStatPage.tsx";
import UserPage from "@/features/profile/components/UserPage.tsx";
import PersonalListPage from "@/features/personal/components/PersonalListPage.tsx";
import { AuthGate } from "@/features/auth/components/AuthGate.tsx";
import type { AuthResponse } from "@/features/auth/api/auth.ts";
import { CircleUser, Film, Users } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useTranslation } from "react-i18next";
import { useNavDrag } from "@/hooks/useNavDrag.ts";
import { ToastProvider } from "@/components/ToastProvider.tsx";

type Tab = "group" | "personal" | "misc";
type Page = Tab | "stat" | "personalStat";

const TABS: Array<{ id: Tab; labelKey: string; icon: React.ReactNode }> = [
  { id: "group", labelKey: "nav.groupList", icon: <Users size={30} /> },
  { id: "personal", labelKey: "nav.personalList", icon: <Film size={30} /> },
  { id: "misc", labelKey: "nav.profile", icon: <CircleUser size={30} /> },
];

function AppShell({ session }: Readonly<{ session: AuthResponse }>) {
  const { t } = useTranslation();
  const defaultTab: Tab = session.defaultPage === "watchlist" ? "personal" : "group";
  const [currentPage, setCurrentPage] = useState<Page>(defaultTab);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const isAdmin = session.role === "admin";

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let maxHeight = vv.height;
    const onResize = () => {
      maxHeight = Math.max(maxHeight, vv.height);
      setKeyboardOpen(vv.height < maxHeight - 100);
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  const rawTabIndex = TABS.findIndex((tab) => tab.id === (currentPage as Tab));
  const fallbackTab = currentPage === "personalStat" ? "personal" : "group";
  const currentTabIndex = rawTabIndex === -1 ? TABS.findIndex((tab) => tab.id === fallbackTab) : rawTabIndex;
  const { navRef, indicatorRef } = useNavDrag(TABS.length, currentTabIndex, (idx) => {
    setCurrentPage(TABS[idx].id);
  });

  const selectTab = (tab: Tab) => {
    hapticTabTap();
    setCurrentPage(tab);
  };

  return (
    <ToastProvider>
    <div className="app-shell">
      <main className="app-main">
        <div hidden={currentPage !== "group" && currentPage !== "stat"}><GroupListPage isAdmin={isAdmin} currentUserId={session.userId} onShowStats={() => setCurrentPage("stat")} /></div>
        <div hidden={currentPage !== "stat"}><StatPage active={currentPage === "stat"} onBack={() => setCurrentPage("group")} /></div>
        <div hidden={currentPage !== "personal" && currentPage !== "personalStat"}><PersonalListPage onShowStats={() => setCurrentPage("personalStat")} /></div>
        <div hidden={currentPage !== "personalStat"}><PersonalStatPage active={currentPage === "personalStat"} onBack={() => setCurrentPage("personal")} /></div>
        <div hidden={currentPage !== "misc"}><UserPage session={session} /></div>
      </main>
      <nav ref={navRef} className={`bottom-bar${keyboardOpen ? " bottom-bar--hidden" : ""}`}>
        <span ref={indicatorRef} className="bottom-bar__indicator" aria-hidden="true" />
        {TABS.map(({ id, labelKey, icon }) => (
          <button
            key={id}
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
    </ToastProvider>
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
