import { useEffect, useRef, useState } from "react";
import { useSwipeBack } from "../hooks/useSwipeBack.ts";
import { getTelegramWebApp, isTelegramMiniApp } from "../api/telegram.ts";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { useAsync } from "../hooks/useAsync.ts";
import { fetchPersonalList } from "../api/personalList.ts";

type PersonalStatPageProps = {
  active: boolean;
  onBack: () => void;
};

const PersonalStatPage = ({ active, onBack }: PersonalStatPageProps) => {
  const { t } = useTranslation();
  const [sectionEl, setSectionEl] = useState<HTMLElement | null>(null);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const state = useAsync(() => fetchPersonalList(), []);

  useEffect(() => {
    if (!active) return;
    const btn = getTelegramWebApp()?.BackButton;
    if (!btn) return;
    const handler = () => onBackRef.current();
    btn.show();
    btn.onClick(handler);
    return () => {
      btn.offClick(handler);
      btn.hide();
    };
  }, [active]);

  useSwipeBack(onBack, active ? sectionEl : null);

  const isTg = isTelegramMiniApp();

  if (state.status === "loading") return <section className="stat-page" />;
  if (state.status === "error") {
    return (
      <section className="stat-page">
        <p className="stat-page__error">Error: {state.error.message}</p>
      </section>
    );
  }

  const movies = state.data;
  const toWatch = movies.filter((m) => !m.watched).length;
  const watched = movies.filter((m) => m.watched).length;

  return (
    <section className="stat-page" ref={setSectionEl}>
      {!isTg && (
        <button type="button" className="stat-page__back" onClick={onBack}>
          <ChevronLeft size={20} />
          {t('nav.back')}
        </button>
      )}
      <div className="personal-stat__grid">
        <div className="personal-stat__card">
          <span className="personal-stat__value">{toWatch}</span>
          <span className="personal-stat__label">{t('personalList.labelToWatch')}</span>
        </div>
        <div className="personal-stat__card">
          <span className="personal-stat__value">{watched}</span>
          <span className="personal-stat__label">{t('personalList.labelWatched')}</span>
        </div>
      </div>
    </section>
  );
};

export default PersonalStatPage;