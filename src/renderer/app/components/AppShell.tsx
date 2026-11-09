import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, RadioTower, Map, FileText, Settings, Sprout, HardDrive, LogOut, User } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { type MessageKey } from '@renderer/i18n/messages'
import { TerritoryPanel } from './TerritoryPanel'
import { useAuthStore } from '@renderer/services/authStore'

const navigation = [
  { to: '/', label: 'overview', icon: LayoutDashboard },
  { to: '/coverage', label: 'coverage', icon: RadioTower },
  { to: '/map', label: 'map', icon: Map },
  { to: '/reports', label: 'reports', icon: FileText },
  { to: '/settings', label: 'settings', icon: Settings },
] as const satisfies ReadonlyArray<{ to: string; label: MessageKey; icon: typeof Map }>

export function AppShell() {
  const t = useTranslation()
  const { username, logout } = useAuthStore()
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
          <div className="brand-icon">
            <Sprout aria-hidden="true" size={22} />
          </div>
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

        {/* Workspace Storage Note */}
        <div className="workspace-note">
          <HardDrive size={16} aria-hidden="true" className="shrink-0 text-[var(--accent)]" />
          <span>{t('localWorkspace')}</span>
          <span className="sidebar-version-badge">local</span>
        </div>

        {/* User Account / Session Pill */}
        {username && (
          <div className="account-note">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <User size={13} aria-hidden="true" />
              </div>
              <span>{username}</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5"
              onClick={() => void logout()}
            >
              <LogOut size={12} aria-hidden="true" />
              <span>{t('logout')}</span>
            </button>
          </div>
        )}
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
