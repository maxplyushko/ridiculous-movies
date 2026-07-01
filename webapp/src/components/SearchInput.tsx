import { Search, X } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function SearchInput({ value, onChange, placeholder }: Readonly<SearchInputProps>) {
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
          <button className="mlp__search-clear" onClick={() => onChange("")} aria-label={placeholder}>
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
