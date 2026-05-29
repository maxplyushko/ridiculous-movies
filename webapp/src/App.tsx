import './index.css'
import {useState} from "react";
import MovieListPage from "./components/MovieListPage.tsx";
import StatPage from "./components/StatPage.tsx";
import MiscPage from "./components/MiscPage.tsx";
import {ChartLine, Film, MoreHorizontal} from "lucide-react";
import {hapticTabTap} from "./haptics.ts";

type Tab = "stat" | "list" | "misc";

function App() {
  const [currentPage, setCurrentPage] = useState<Tab>("list")

  function selectTab(tab: Tab) {
    hapticTabTap();
    setCurrentPage(tab);
  }
  return (
      <div className="app-shell">
        <main className="app-main">
          <div hidden={currentPage !== "stat"}><StatPage /></div>
          <div hidden={currentPage !== "list"}><MovieListPage /></div>
          <div hidden={currentPage !== "misc"}><MiscPage /></div>
        </main>

        <nav className="bottom-bar">
          <button
              className={`bottom-bar-button${currentPage === "stat" ? " active" : ""}`}
              aria-label="Statistics"
              aria-current={currentPage === "stat" ? "page" : undefined}
              onClick={() => selectTab("stat")}>
            <ChartLine size={45}/>
          </button>
          <button
              className={`bottom-bar-button${currentPage === "list" ? " active" : ""}`}
              aria-label="Movie List"
              aria-current={currentPage === "list" ? "page" : undefined}
              onClick={() => selectTab("list")}>
            <Film size={45}/>
          </button>
          <button
              className={`bottom-bar-button${currentPage === "misc" ? " active" : ""}`}
              aria-label="Misc"
              aria-current={currentPage === "misc" ? "page" : undefined}
              onClick={() => selectTab("misc")}>
            <MoreHorizontal size={45}/>
          </button>
        </nav>
      </div>
  )
}

export default App
