import { useTranslation } from "react-i18next";

type ErrorScreenProps = {
  error: unknown;
  fullScreen?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorScreen({ error, fullScreen = false, actionLabel, onAction }: Readonly<ErrorScreenProps>) {
  const { t } = useTranslation();
  const code = error instanceof Error ? error.message : String(error);

  return (
    <div className={`error-screen${fullScreen ? " error-screen--full" : ""}`}>
      <p className="error-screen__title">{t('errors.title')}</p>
      <p className="error-screen__code">{code}</p>
      {onAction && actionLabel && (
        <button type="button" className="error-screen__action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
