import { useState } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { ErrorScreen } from "@/components/ErrorScreen.tsx";
import { useTranslation } from "react-i18next";
import { useAsync } from "@/hooks/useAsync.ts";
import { fetchPersonalList } from "../api/personalList.ts";

type PersonalStatPageProps = {
  active: boolean;
  onBack: () => void;
};

const PersonalStatPage = ({ active, onBack }: PersonalStatPageProps) => {
  const { t } = useTranslation();
  const [sectionEl, setSectionEl] = useState<HTMLElement | null>(null);
  const state = useAsync(() => fetchPersonalList(), []);

  useSwipeBack(onBack, active ? sectionEl : null);

  if (state.status === "loading") return <section className="stat-page" />;
  if (state.status === "error") {
    return (
      <section className="stat-page">
        <PageBackButton onBack={onBack} active={active} />
        <ErrorScreen error={state.error} />
      </section>
    );
  }

  const movies = state.data;
  const toWatch = movies.filter((m) => !m.watched).length;
  const watched = movies.filter((m) => m.watched).length;

  return (
    <section className="stat-page" ref={setSectionEl}>
      <PageBackButton onBack={onBack} active={active} />
      <h1 className="page-title">{t('groupList.labelStatistics')}</h1>
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