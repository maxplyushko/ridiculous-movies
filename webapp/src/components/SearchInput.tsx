import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  cancelLabel: string;
  onCancel: () => void;
  keyboardOffset?: number;
  closing?: boolean;
};

export function SearchInput({
  value,
  onChange,
  placeholder,
  cancelLabel,
  onCancel,
  keyboardOffset = 0,
  closing = false,
}: Readonly<SearchInputProps>) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (closing) inputRef.current?.blur();
  }, [closing]);

  return (
    <div
      className={`mlp__search-bar mlp__search-bar--docked${keyboardOffset > 0 ? " mlp__search-bar--lifted" : ""}${closing ? " mlp__search-bar--closing" : ""}`}
      style={{ bottom: `${keyboardOffset}px` }}
    >
      <div className="mlp__search">
        <Search size={18} className="mlp__search-icon" />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="mlp__search-cancel"
        aria-label={cancelLabel}
        onClick={() => {
          hapticTabTap();
          if (value) {
            onChange("");
            inputRef.current?.focus();
            return;
          }
          onCancel();
        }}
      >
        <X size={22} />
      </button>
    </div>
  );
}
