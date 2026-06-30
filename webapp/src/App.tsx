import './index.css';
import { useEffect, useState } from "react";
import GroupListPage from "./components/GroupListPage.tsx";
import StatPage from "./components/StatPage.tsx";
import UserPage from "./components/UserPage.tsx";
import PersonalListPage from "./components/PersonalListPage.tsx";
import { AuthGate } from "./components/AuthGate.tsx";
import type { AuthResponse } from "./api/auth.ts";
import { CircleUser, Film, Users } from "lucide-react";
import { hapticTabTap } from "./haptics.ts";
import { useTranslation } from "react-i18next";
import { useNavDrag } from "./hooks/useNavDrag.ts";

type Tab = "group" | "personal" | "misc";
type Page = Tab | "stat";

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
  const currentTabIndex = rawTabIndex === -1 ? TABS.findIndex((tab) => tab.id === "group") : rawTabIndex;
  const { navRef, indicatorRef } = useNavDrag(TABS.length, currentTabIndex, (idx) => {
    setCurrentPage(TABS[idx].id);
  });

  const selectTab = (tab: Tab) => {
    hapticTabTap();
    setCurrentPage(tab);
  };

  return (
    <div className="app-shell">
      <main className="app-main">
        <div hidden={currentPage !== "stat"}><StatPage active={currentPage === "stat"} onBack={() => setCurrentPage("group")} /></div>
        <div hidden={currentPage !== "group"}><GroupListPage isAdmin={isAdmin} currentUserId={session.userId} onShowStats={() => setCurrentPage("stat")} /></div>
        <div hidden={currentPage !== "personal"}><PersonalListPage /></div>
        <div hidden={currentPage !== "misc"}><UserPage session={session} /></div>
      </main>
      <nav ref={navRef} className={`bottom-bar${keyboardOpen ? " bottom-bar--hidden" : ""}`}>
        <span ref={indicatorRef} className="bottom-bar__indicator" aria-hidden="true" />
        {TABS.map(({ id, labelKey, icon }) => (
          <button
            key={id}
            className={`bottom-bar-button${(currentPage === id || (currentPage === "stat" && id === "group")) ? " active" : ""}`}
            aria-label={t(labelKey)}
            aria-current={(currentPage === id || (currentPage === "stat" && id === "group")) ? "page" : undefined}
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
  return (
    <AuthGate>
      {(session) => <AppShell session={session} />}
    </AuthGate>
  );
}

export default App;
