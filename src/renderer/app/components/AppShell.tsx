import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, RadioTower, Map, FileText, Settings, Sprout, HardDrive } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { type MessageKey } from '@renderer/i18n/messages'
import { PreferencesPanel } from './PreferencesPanel'
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
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{t('skipContent')}</a>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Sprout aria-hidden="true" size={24} /></div>
          <div><strong>NetAgro<span>Colombia</span></strong></div>
        </div>
        <p className="sidebar-caption">{t('tagline')}</p>
        <nav aria-label={t('navigation')}>
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={19} aria-hidden="true" /><span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="workspace-note"><HardDrive size={17} aria-hidden="true" /><span>{t('localWorkspace')}</span></div>
      </aside>
      <main id="main-content" tabIndex={-1} className="min-w-0"><Outlet /></main>
      <aside className="inspector">
        <TerritoryPanel />
        <PreferencesPanel />
      </aside>
    </div>
  )
}
