import { useTranslation } from "react-i18next";
import { Loader } from "lucide-react";
import type { TmdbPerson } from "@/types/TmdbPerson";
import TmdbPersonItem from "./TmdbPersonItem.tsx";

type TmdbPeopleSectionProps = {
  results: TmdbPerson[];
  loading: boolean;
  showEmptyMessage: boolean;
  onOpenPerson: (person: TmdbPerson) => void;
};

const TmdbPeopleSection = ({ results, loading, showEmptyMessage, onOpenPerson }: TmdbPeopleSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="tmdb-section">
      <div className="movie-group__header">
        <h3>{t('tmdb.sectionPeople')}</h3>
        {loading && <Loader size={14} className="tmdb-section__spinner" />}
      </div>
      {showEmptyMessage && (
        <p className="movie-list__no-results">{t('tmdb.emptyPeople')}</p>
      )}
      {results.map((p) => (
        <TmdbPersonItem key={p.id} person={p} onOpen={() => onOpenPerson(p)} />
      ))}
    </div>
  );
};

export default TmdbPeopleSection;
