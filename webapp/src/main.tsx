import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import "./index.css";
import "./i18n/index.ts";
import App from "./App.tsx";
import {initTelegramWebApp} from "./telegramTheme.ts";

initTelegramWebApp();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App/>
    </StrictMode>,
);
