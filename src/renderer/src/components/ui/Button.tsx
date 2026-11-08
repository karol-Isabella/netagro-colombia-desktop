import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        // Variants
        variant === 'primary' &&
          'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 active:scale-95',
        variant === 'secondary' &&
          'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600',
        variant === 'ghost' &&
          'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
        variant === 'danger' &&
          'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600',
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
