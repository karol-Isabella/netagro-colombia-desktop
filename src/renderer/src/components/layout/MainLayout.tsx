import React from 'react';
import { cn } from '../../lib/utils';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';

interface MainLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('flex h-screen bg-white dark:bg-slate-950', className)}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* Right Panel */}
        <RightPanel />
      </main>
    </div>
  );
};
