import { useLayoutEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { hapticTabTap } from "@/utils/haptics.ts";

type ListSearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  onOpen?: () => void;
};

export function ListSearchBar({ value = "", onChange, placeholder, autoFocus, onOpen }: Readonly<ListSearchBarProps>) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  if (onOpen) {
    return (
      <div className="mlp__search-bar">
        <button type="button" className="mlp__search mlp__search--trigger" onClick={onOpen}>
          <Search size={18} className="mlp__search-icon" />
          <span className="mlp__search-placeholder">{placeholder}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mlp__search-bar">
      <div className="mlp__search">
        <Search size={18} className="mlp__search-icon" />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur(); } }}
        />
        {value && (
          <button
            type="button"
            className="mlp__search-clear"
            aria-label={t('search.clearLabel')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { hapticTabTap(); onChange?.(""); }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
