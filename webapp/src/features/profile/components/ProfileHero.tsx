import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Shield, User as UserIcon, Users } from "lucide-react";

export function ProfileHero({ name, role, groupName, action, backButton }: Readonly<{
  name: string;
  role: "user" | "admin";
  groupName: string;
  action?: ReactNode;
  backButton?: ReactNode;
}>) {
  const { t } = useTranslation();
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return (
    <div className="user-page__hero">
      <div className="user-page__banner">
        {backButton}
        {action}
        <h1 className="user-page__banner-name">
          <span className="user-page__banner-firstname">{firstName}</span>
          {lastName && <span className="user-page__banner-lastname">{lastName}</span>}
        </h1>
        <UserIcon size={190} strokeWidth={1.25} className="user-page__banner-avatar" />
      </div>
      <div className="user-page__identity">
        <p className="user-page__subtitle">
          <span className={`user-page__meta user-page__meta--${role}`}>
            <Shield size={16} />
            {role === "admin" ? t('userPage.badgeAdmin') : t('userPage.badgeMember')}
          </span>
          <span className="user-page__meta">
            <Users size={16} />
            {groupName}
          </span>
        </p>
      </div>
    </div>
  );
}
