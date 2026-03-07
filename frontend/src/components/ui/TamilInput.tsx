import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';
import { useTamilTransliteration } from '../../hooks/useTamilTransliteration';

interface TamilInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onValueChange: (value: string) => void;
}

/**
 * Input component with Thanglish → Tamil transliteration.
 * Wraps a standard <input> with transliteration on space/enter.
 * Shows a small "த" badge to indicate Tamil mode.
 */
export default function TamilInput({ label, error, onValueChange, ...props }: TamilInputProps) {
  const id = useId();
  const { handleKeyDown, handleChange } = useTamilTransliteration();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-secondary flex items-center gap-1.5">
        {label}
        <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-semibold">
          த
        </span>
      </label>
      <input
        id={id}
        className="px-3 py-2 transition-all border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        {...props}
        onChange={(e) => handleChange(e, onValueChange)}
        onKeyDown={(e) => {
          handleKeyDown(e);
          props.onKeyDown?.(e);
        }}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
