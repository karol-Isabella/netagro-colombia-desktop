import React from 'react';
import { cn } from '../../lib/utils';

interface ThreeColumnLayoutProps {
  leftPanel?: React.ReactNode;
  centerPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  className?: string;
}

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
  className,
}) => {
  return (
    <div className={cn('flex h-full gap-4 overflow-hidden', className)}>
      {/* Left Panel - Filters */}
      {leftPanel && (
        <div className="w-64 flex-shrink-0 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          {leftPanel}
        </div>
      )}

      {/* Center Panel - Map */}
      {centerPanel && (
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 shadow-sm">
          {centerPanel}
        </div>
      )}

      {/* Right Panel - Analysis */}
      {rightPanel && (
        <div className="w-80 flex-shrink-0 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          {rightPanel}
        </div>
      )}
    </div>
  );
};
