import { User } from "lucide-react";
import type { TmdbPerson } from "@/types/TmdbPerson";
import { hapticTabTap } from "@/utils/haptics.ts";

type TmdbPersonItemProps = {
  person: TmdbPerson;
  onOpen: () => void;
};

const TmdbPersonItem = ({ person, onOpen }: TmdbPersonItemProps) => (
  <div className="movie-item-wrapper">
    <button
      type="button"
      className="tmdb-person-item"
      onClick={() => { hapticTabTap(); onOpen(); }}
    >
      <div className="tmdb-person-item__avatar">
        {person.profileUrl
          ? <img src={person.profileUrl} alt={person.name} loading="lazy" decoding="async" />
          : <User size={20} />}
      </div>
      <div className="tmdb-person-item__left">
        <span className="tmdb-person-item__name">{person.name}</span>
        {person.knownFor.length > 0 && (
          <span className="tmdb-person-item__known-for">{person.knownFor.join(", ")}</span>
        )}
      </div>
    </button>
  </div>
);

export default TmdbPersonItem;
