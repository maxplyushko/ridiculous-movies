import { useTranslation } from "react-i18next";
import { Loader } from "lucide-react";
import type { TmdbPerson } from "@/types/TmdbPerson";
import { useTmdbPersonSearch } from "@/hooks/useTmdbPersonSearch.ts";
import TmdbPersonItem from "./TmdbPersonItem.tsx";

type TmdbPeopleSectionProps = {
  query: string;
  onOpenPerson: (person: TmdbPerson) => void;
};

const TmdbPeopleSection = ({ query, onOpenPerson }: TmdbPeopleSectionProps) => {
  const { t } = useTranslation();
  const { results, loading } = useTmdbPersonSearch(query);

  if (query.trim().length < 3) return null;
  if (!loading && results.length === 0) return null;

  return (
    <div className="tmdb-section">
      <div className="movie-group__header">
        <h3>{t('tmdb.sectionPeople')}</h3>
        {loading && <Loader size={14} className="tmdb-section__spinner" />}
      </div>
      {results.map((p) => (
        <TmdbPersonItem key={p.id} person={p} onOpen={() => onOpenPerson(p)} />
      ))}
    </div>
  );
};

export default TmdbPeopleSection;
