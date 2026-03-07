import type { InputHTMLAttributes } from 'react';
import { useId, useState } from 'react';
import { useTamilTransliteration } from '../../hooks/useTamilTransliteration';

interface TamilInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onValueChange: (value: string) => void;
  inputClassName?: string;
}

/**
 * Input component with Thanglish → Tamil transliteration.
 * Wraps a standard <input> with transliteration on space/enter.
 * Shows a small "த" badge to indicate Tamil mode.
 */
export default function TamilInput({ label, error, onValueChange, className, inputClassName, ...props }: TamilInputProps) {
  const id = useId();
  const [isTamil, setIsTamil] = useState(true);
  const { handleKeyDown, handleChange } = useTamilTransliteration(isTamil);

  const badge = (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold cursor-pointer transition-colors flex items-center justify-center shrink-0 ${
        isTamil
          ? 'bg-primary/20 text-primary hover:bg-primary/30'
          : 'bg-surface text-text-secondary border border-border hover:bg-surface-hover shadow-sm'
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsTamil(!isTamil);
      }}
      title={isTamil ? "Tamil mode active. Click to switch to English." : "English mode active. Click to switch to Tamil."}
    >
      {isTamil ? 'த' : 'En'}
    </span>
  );

  return (
    <div className={`flex flex-col gap-1.5 relative ${className || ''}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {label}
            {props.required && <span className="text-error">*</span>}
          </div>
          {badge}
        </label>
      )}

      <div className="relative group/tamil-input">
        <input
          id={id}
          className={`w-full px-3 py-2 pr-10 transition-all border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60 disabled:bg-surface bg-card text-text-primary placeholder:text-text-disabled text-sm ${
            !label ? 'pr-12' : ''
          } ${inputClassName || ''}`}
          {...props}
          onChange={(e) => handleChange(e, onValueChange)}
          onKeyDown={(e) => {
            handleKeyDown(e);
            props.onKeyDown?.(e);
          }}
        />
        {!label && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {badge}
          </div>
        )}
      </div>

      {error && <span className="text-xs text-error mt-0.5">{error}</span>}
    </div>
  );
}
