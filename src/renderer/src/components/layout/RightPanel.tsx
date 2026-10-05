import React from 'react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../stores/themeStore';
import { Moon, Sun, Monitor } from 'lucide-react';

interface RightPanelProps {
  className?: string;
}

export const RightPanel: React.FC<RightPanelProps> = ({ className }) => {
  const { theme, setTheme } = useThemeStore();

  return (
    <aside
      className={cn(
        'w-64 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800',
        'flex flex-col h-screen p-4 overflow-y-auto',
        className
      )}
    >
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Theme
      </h2>

      <div className="space-y-2">
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
            theme === 'light'
              ? 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Sun className="w-5 h-5" />
          <span className="text-sm font-medium">Light</span>
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
            theme === 'dark'
              ? 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Moon className="w-5 h-5" />
          <span className="text-sm font-medium">Dark</span>
        </button>

        <button
          onClick={() => setTheme('system')}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
            theme === 'system'
              ? 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Monitor className="w-5 h-5" />
          <span className="text-sm font-medium">System</span>
        </button>
      </div>
    </aside>
  );
};
