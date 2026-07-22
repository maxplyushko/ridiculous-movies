import { useTranslation } from "react-i18next";
import { ChevronRight, Clapperboard, Lock } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import type { Stats } from "@/features/stats/types/Stat.ts";
import type { User } from "@/types/User.ts";
import { ProfileHero } from "./ProfileHero.tsx";
import { ProfileStatGrid } from "./ProfileStatGrid.tsx";

export function MemberProfileView({ member, groupName, stats, onBack, onOpenList }: Readonly<{
  member: User;
  groupName: string;
  stats: Stats | null;
  onBack: () => void;
  onOpenList: () => void;
}>) {
  const { t } = useTranslation();
  const locked = !member.personalListPublic;

  return (
    <section className="user-page">
      <ProfileHero
        name={member.name}
        role={member.role}
        groupName={groupName}
        backButton={<PageBackButton onBack={onBack} />}
      />

      <div className="user-page__section">
        <div className="user-page__card">
          <button
            type="button"
            className={`user-page__member-row${locked ? " user-page__member-row--locked" : ""}`}
            disabled={locked}
            onClick={() => {
              if (locked) return;
              hapticTabTap();
              onOpenList();
            }}
          >
            <span className="user-page__row-label">
              <Clapperboard size={20} /> {t('userPage.btnShowMovieList')}
            </span>
            {locked ? <Lock size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      <ProfileStatGrid userId={member.id} stats={stats} />
    </section>
  );
}
