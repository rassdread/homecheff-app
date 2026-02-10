'use client';
import * as React from 'react';

export type ChipToggleProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  selected?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
};

export function ChipToggle({
  children,
  selected = false,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: ChipToggleProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: selected
      ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 focus:ring-gray-500'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    primary: selected
      ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 focus:ring-primary-500'
      : 'bg-white text-primary-700 border-primary-300 hover:bg-primary-50 focus:ring-primary-500',
    secondary: selected
      ? 'bg-secondary-600 text-white border-secondary-600 hover:bg-secondary-700 focus:ring-secondary-500'
      : 'bg-white text-secondary-700 border-secondary-300 hover:bg-secondary-50 focus:ring-secondary-500',
  };
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

