import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  BarChart3,
  Map,
  Navigation as NavigationIcon,
  FileText,
  Settings,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: BarChart3,
  },
  {
    label: 'Coverage',
    href: '/coverage',
    icon: Map,
  },
  {
    label: 'Map',
    href: '/map',
    icon: Map,
  },
  {
    label: 'Route Analysis',
    href: '/route-analysis',
    icon: NavigationIcon,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <ul className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;

        return (
          <li key={item.href}>
            <Link
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
