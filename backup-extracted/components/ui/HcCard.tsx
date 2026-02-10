'use client';
import * as React from 'react';

export type HcCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
};

export function HcCard({
  children,
  className = '',
  variant = 'default',
  ...props
}: HcCardProps) {
  const baseClasses = 'rounded-lg bg-white';
  const variantClasses = {
    default: 'border border-gray-200 shadow-sm',
    outlined: 'border-2 border-gray-300',
    elevated: 'border border-gray-200 shadow-lg',
    flat: 'border-0 shadow-none',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function HcCardHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function HcCardContent({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function HcCardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

