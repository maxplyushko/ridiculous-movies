import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import TopToast from "./TopToast.tsx";
import { ToastContext } from "./toastContext.ts";

interface ToastState {
  id: number;
  message: string;
}

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useTranslation();
  const [toast, setToast] = useState<ToastState | null>(null);

  const showGroupAddToast = useCallback((userName: string) => {
    setToast({ id: Date.now(), message: t("personalList.alreadyAddedToast", { user: userName }) });
  }, [t]);

  const value = useMemo(() => ({ showGroupAddToast }), [showGroupAddToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <TopToast key={toast.id} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </ToastContext.Provider>
  );
}
