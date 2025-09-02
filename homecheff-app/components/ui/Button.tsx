'use client';
import * as React from 'react';
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
};
export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition';
  const styles = {
    primary: 'bg-[#006D52] text-white hover:opacity-90',
    outline:
      'border border-[#006D52] text-[#006D52] bg-white hover:bg-[#F0FFF9]',
    ghost: 'bg-transparent text-[#006D52] hover:bg-[#F0FFF9]',
  } as const;
  return (
    <button
      {...props}
      className={[base, styles[variant], className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}