import './index.css';
import { useEffect, useState } from "react";
import GroupListPage from "./components/GroupListPage.tsx";
import StatPage from "./components/StatPage.tsx";
import UserPage from "./components/UserPage.tsx";
import PersonalListPage from "./components/PersonalListPage.tsx";
import { AuthGate } from "./components/AuthGate.tsx";
import type { AuthResponse } from "./api/auth.ts";
import { ChartLine, CircleUser, Film, ListTodo } from "lucide-react";
import { hapticTabTap } from "./haptics.ts";
import { useTranslation } from "react-i18next";

type Tab = "stat" | "group" | "personal" | "misc";

const TABS: Array<{ id: Tab; labelKey: string; icon: React.ReactNode }> = [
  { id: "stat", labelKey: "nav.stats", icon: <ChartLine size={30} /> },
  { id: "group", labelKey: "nav.groupList", icon: <Film size={30} /> },
  { id: "personal", labelKey: "nav.personalList", icon: <ListTodo size={30} /> },
  { id: "misc", labelKey: "nav.profile", icon: <CircleUser size={30} /> },
];

function AppShell({ session }: Readonly<{ session: AuthResponse }>) {
  const { t } = useTranslation();
  const defaultTab: Tab = session.defaultPage === "watchlist" ? "personal" : "group";
  const [currentPage, setCurrentPage] = useState<Tab>(defaultTab);
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

  const selectTab = (tab: Tab) => {
    hapticTabTap();
    setCurrentPage(tab);
  };

  return (
    <div className="app-shell">
      <main className="app-main">
        <div hidden={currentPage !== "stat"}><StatPage active={currentPage === "stat"} /></div>
        <div hidden={currentPage !== "group"}><GroupListPage isAdmin={isAdmin} /></div>
        <div hidden={currentPage !== "personal"}><PersonalListPage /></div>
        <div hidden={currentPage !== "misc"}><UserPage session={session} /></div>
      </main>
      <nav className={`bottom-bar${keyboardOpen ? " bottom-bar--hidden" : ""}`}>
        {TABS.map(({ id, labelKey, icon }) => (
          <button
            key={id}
            className={`bottom-bar-button${currentPage === id ? " active" : ""}`}
            aria-label={t(labelKey)}
            aria-current={currentPage === id ? "page" : undefined}
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
