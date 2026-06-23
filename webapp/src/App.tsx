import './index.css';
import { useEffect, useState } from "react";
import MovieListPage from "./components/MovieListPage.tsx";
import StatPage from "./components/StatPage.tsx";
import MiscPage from "./components/MiscPage.tsx";
import { AuthGate } from "./components/AuthGate.tsx";
import type { AuthResponse } from "./api/auth.ts";
import { ChartLine, Film, MoreHorizontal } from "lucide-react";
import { hapticTabTap } from "./haptics.ts";

type Tab = "stat" | "list" | "misc";

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "stat", label: "Statistics", icon: <ChartLine size={30} /> },
  { id: "list", label: "Movie List", icon: <Film size={30} /> },
  { id: "misc", label: "Misc", icon: <MoreHorizontal size={30} /> },
];

function AppShell({ session }: Readonly<{ session: AuthResponse }>) {
  const [currentPage, setCurrentPage] = useState<Tab>("list");
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
        <div hidden={currentPage !== "list"}><MovieListPage isAdmin={isAdmin} /></div>
        <div hidden={currentPage !== "misc"}><MiscPage /></div>
      </main>
      <nav className={`bottom-bar${keyboardOpen ? " bottom-bar--hidden" : ""}`}>
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`bottom-bar-button${currentPage === id ? " active" : ""}`}
            aria-label={label}
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
