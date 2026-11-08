import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600',
        'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
        'placeholder:text-slate-500 dark:placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
