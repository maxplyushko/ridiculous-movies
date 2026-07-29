import { useRef } from "react";
import { X } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  cancelLabel: string;
};

export function SearchInput({ value, onChange, placeholder, cancelLabel }: Readonly<SearchInputProps>) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="search-bottom-bar__input-row">
      <div className="search-bottom-bar__input-wrap">
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            type="button"
            className="mlp__search-clear"
            aria-label={placeholder}
            onClick={() => {
              hapticTabTap();
              onChange("");
              inputRef.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <button
        type="button"
        className="mlp__search-cancel"
        aria-label={cancelLabel}
        onClick={() => {
          hapticTabTap();
          inputRef.current?.blur();
        }}
      >
        <X size={20} />
      </button>
    </div>
  );
}
