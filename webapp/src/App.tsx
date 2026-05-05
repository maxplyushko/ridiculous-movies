import './index.css'
import {useState} from "react";
import MovieListPage from "./components/MovieListPage.tsx";
import StatPage from "./components/StatPage.tsx";
import MiscPage from "./components/MiscPage.tsx";
import {ChartLine, Film, MoreHorizontal} from "lucide-react";

type Tab = "stat" | "list" | "misc";

function App() {

  const [currentPage, setCurrentPage] = useState<Tab>("list")

  return (
    <div className="app-shell">
      <main className="app-main">
        {currentPage === "stat" && (<StatPage/>)}
        {currentPage === "list" && (<MovieListPage/>)}
        {currentPage === "misc" && (<MiscPage/>)}
      </main>

      <nav className="bottom-bar">
        <button className="bottom-bar-button" aria-label="Statistics" onClick={()=>setCurrentPage("stat")}>
          <ChartLine size={35} />
        </button>
        <button className="bottom-bar-button" aria-label="Movie List" onClick={()=>setCurrentPage("list")}>
          <Film size={35} />
        </button>
        <button className="bottom-bar-button" aria-label="Misc" onClick={()=>setCurrentPage("misc")}>
          <MoreHorizontal size={35} />
        </button>
      </nav>
    </div>
  )
}

export default App
