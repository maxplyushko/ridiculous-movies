import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Clapperboard, Lock } from "lucide-react";
import { hapticError, hapticTabTap } from "@/utils/haptics.ts";
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
  const [trembling, setTrembling] = useState(false);
  const [showRestricted, setShowRestricted] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handleLockedClick = () => {
    hapticError();
    timers.current.forEach(clearTimeout);
    setTrembling(true);
    setShowRestricted(true);
    timers.current = [
      window.setTimeout(() => setTrembling(false), 600),
      window.setTimeout(() => setShowRestricted(false), 3000),
    ];
  };

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
            className={`user-page__member-row${locked ? " user-page__member-row--locked" : ""}${trembling ? " user-page__member-row--tremble" : ""}`}
            onClick={() => {
              if (locked) {
                handleLockedClick();
                return;
              }
              hapticTabTap();
              onOpenList();
            }}
          >
            <span className="user-page__row-label">
              <Clapperboard size={20} />{" "}
              <span
                key={showRestricted ? "restricted" : "default"}
                className="user-page__row-text user-page__row-text--fade"
              >
                {showRestricted ? t('userPage.listRestricted') : t('userPage.btnShowMovieList')}
              </span>
            </span>
            {locked
              ? <Lock size={16} />
              : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      <ProfileStatGrid userId={member.id} stats={stats} />
    </section>
  );
}
