import { useTranslation } from "react-i18next";

type ErrorScreenProps = {
  error: unknown;
  fullScreen?: boolean;
};

export function ErrorScreen({ error, fullScreen = false }: Readonly<ErrorScreenProps>) {
  const { t } = useTranslation();
  const code = error instanceof Error ? error.message : String(error);

  return (
    <div className={`error-screen${fullScreen ? " error-screen--full" : ""}`}>
      <p className="error-screen__title">{t('errors.title')}</p>
      <p className="error-screen__code">{code}</p>
    </div>
  );
}
