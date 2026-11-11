import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, RadioTower, Map, FileText, Settings } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { type MessageKey } from '@renderer/i18n/messages'
import { TerritoryPanel } from './TerritoryPanel'

const navigation = [
  { to: '/', label: 'overview', icon: LayoutDashboard },
  { to: '/coverage', label: 'coverage', icon: RadioTower },
  { to: '/map', label: 'map', icon: Map },
  { to: '/reports', label: 'reports', icon: FileText },
  { to: '/settings', label: 'settings', icon: Settings },
] as const satisfies ReadonlyArray<{ to: string; label: MessageKey; icon: typeof Map }>

export function AppShell() {
  const t = useTranslation()
  const location = useLocation()
  const isMapWorkspace = location.pathname === '/map' || location.pathname === '/coverage'
  const isSettings = location.pathname === '/settings'

  return (
    <div className={`${isMapWorkspace ? 'app-shell map-workspace-shell' : 'app-shell'}${isSettings ? ' settings-workspace-shell' : ''}`}>
      {/* Global Aurora Background (subtle, behind everything) */}
      <div className="dashboard-aurora" aria-hidden="true">
        <div className="dashboard-aurora-orb-1" />
        <div className="dashboard-aurora-orb-2" />
        <div className="dashboard-aurora-orb-3" />
      </div>

      <a className="skip-link" href="#main-content">
        {t('skipContent')}
      </a>

      {/* Floating Modern SaaS Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-icon-image" src="./netagro-mark.svg" alt="" />
          <div>
            <strong>NetAgro</strong>
            <span>Colombia</span>
          </div>
        </div>

        <p className="sidebar-caption">{t('tagline')}</p>

        {/* Primary Navigation List */}
        <nav aria-label={t('navigation')}>
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* Main Routed Content Area */}
      <main id="main-content" tabIndex={-1} className="min-w-0">
        <Outlet />
      </main>

      {/* Inspector (Right Control Panel) */}
      <aside className="inspector">
        <TerritoryPanel />
      </aside>
    </div>
  )
}
