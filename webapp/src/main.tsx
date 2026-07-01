import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import "@/styles/global.css";
import "@/lib/i18n/index.ts";
import App from "./App.tsx";
import {initTelegramWebApp} from "@/lib/telegram/telegramTheme.ts";

initTelegramWebApp();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App/>
    </StrictMode>,
);
