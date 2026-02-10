'use client';
import * as React from 'react';
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'default';
};
export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const styles = {
    primary: 'bg-primary-brand text-white hover:bg-primary-700 focus:ring-primary-brand shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    outline:
      'border-2 border-primary-brand text-primary-brand bg-white hover:bg-primary-50 focus:ring-primary-brand hover:shadow-md',
    ghost: 'bg-transparent text-primary-brand hover:bg-primary-50 focus:ring-primary-brand hover:shadow-sm',
    default: 'bg-primary-brand text-white hover:bg-primary-700 focus:ring-primary-brand shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
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