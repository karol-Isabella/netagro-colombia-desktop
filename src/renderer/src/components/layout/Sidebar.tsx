import React from 'react';
import { cn } from '../../lib/utils';
import { Navigation } from './Navigation';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  return (
    <aside
      className={cn(
        'w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800',
        'flex flex-col h-screen overflow-y-auto',
        className
      )}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          NetAgro
        </h1>
      </div>
      <nav className="flex-1 p-4">
        <Navigation />
      </nav>
    </aside>
  );
};
