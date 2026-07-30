import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";

type AsyncButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  onClick?: () => void | Promise<unknown>;
  spinnerSize?: number;
  children: ReactNode;
};

export function AsyncButton({
  onClick,
  spinnerSize = 16,
  disabled,
  children,
  ...rest
}: Readonly<AsyncButtonProps>) {
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const handleClick = async () => {
    if (busy) return;
    hapticTabTap();
    try {
      setBusy(true);
      await onClick?.();
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <button type="button" {...rest} disabled={disabled || busy} aria-busy={busy} onClick={handleClick}>
      {busy && <Loader size={spinnerSize} className="async-btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
