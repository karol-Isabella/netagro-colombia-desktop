import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'font-medium rounded-full inline-flex items-center justify-center',
        // Sizes
        size === 'sm' && 'px-2.5 py-1 text-xs',
        size === 'md' && 'px-3 py-1.5 text-sm',
        // Variants
        variant === 'default' && 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white',
        variant === 'success' && 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300',
        variant === 'warning' && 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
        variant === 'error' && 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
        variant === 'info' && 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';
