import { Search, X } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";

type ListSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function ListSearchBar({ value, onChange, placeholder }: Readonly<ListSearchBarProps>) {
  return (
    <div className="mlp__search-bar">
      <div className="mlp__search">
        <Search size={18} className="mlp__search-icon" />
        <input
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
            onClick={() => { hapticTabTap(); onChange(""); }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
