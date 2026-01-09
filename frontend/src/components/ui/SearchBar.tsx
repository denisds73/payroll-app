import { Search, X } from 'lucide-react';
import { useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar = ({ value, onChange, placeholder }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        ref={inputRef}
        className="bg-card text-text-primary pl-10 py-2.5 w-full rounded-lg border border-secondary/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary pr-10 transition-all"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef?.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hover:bg-secondary/10 rounded-sm p-1 transition-all"
          aria-label="Clear search"
        >
          <X className="h-5 w-5 text-text-secondary hover:text-text-primary" />
        </button>
      )}
    </div>
  );
};
