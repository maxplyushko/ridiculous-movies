import { useRef } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { hapticTabTap } from "@/utils/haptics.ts";
import scrollIntoViewAfterKeyboard from "@/hooks/useScrollIntoViewOnKeyboard.ts";

type ListSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function ListSearchBar({ value, onChange, placeholder }: Readonly<ListSearchBarProps>) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

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
          onFocus={(e) => scrollIntoViewAfterKeyboard(e.currentTarget)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur(); } }}
        />
        {value && (
          <button
            type="button"
            className="mlp__search-clear"
            aria-label={t('search.clearLabel')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { hapticTabTap(); onChange(""); }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
