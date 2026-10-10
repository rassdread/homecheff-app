'use client';

import { normalizeVerificationCodeInput } from '@/lib/verification';

type VerificationCodeFieldProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  label: string;
  hint: string;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
};

/**
 * One logical code field. Paste, autofill and spaced codes are normalized to six digits
 * before the browser length limit can drop a character.
 */
export default function VerificationCodeField({
  id,
  value,
  onChange,
  label,
  hint,
  disabled = false,
  invalid = false,
  autoFocus = false,
}: VerificationCodeFieldProps) {
  const hintId = `${id}-hint`;

  const applyRaw = (raw: string) => {
    onChange(normalizeVerificationCodeInput(raw));
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        name="one-time-code"
        data-testid="verification-code-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        pattern="[0-9]*"
        value={value}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
        onChange={(e) => applyRaw(e.target.value)}
        onInput={(e) => applyRaw((e.target as HTMLInputElement).value)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (!text) return;
          e.preventDefault();
          applyRaw(text);
        }}
        placeholder="000000"
        className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-60"
      />
      <p id={hintId} className="text-xs text-gray-500 mt-2 text-center">
        {hint}
      </p>
    </div>
  );
}
