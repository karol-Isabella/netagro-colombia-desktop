import { Database, RadioTower, MapPinned, Wifi } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'
import type { MessageKey } from '@renderer/i18n/messages'

export type WorkspaceSection = 'overview' | 'coverage' | 'map' | 'reports' | 'routes'
const descriptions: Record<WorkspaceSection, MessageKey> = {
  overview: 'overviewDescription',
  coverage: 'coverageDescription',
  map: 'mapDescription',
  reports: 'reportsDescription',
  routes: 'routesDescription',
}
const emptyMessages: Record<WorkspaceSection, MessageKey> = {
  overview: 'awaitingDescription',
  coverage: 'awaitingDescription',
  map: 'awaitingMap',
  reports: 'awaitingReports',
  routes: 'awaitingRoutes',
}

export function WorkspacePage({ section }: { section: WorkspaceSection }) {
  const t = useTranslation()

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">COLOMBIA</span>
        <h1>{t(section)}</h1>
        <p>{t(descriptions[section])}</p>
      </header>

      {/* Floating Apple-like Empty State */}
      <section className="empty-state" aria-labelledby="empty-heading">
        <div className="empty-illustration">
          <div className="empty-icon">
            <RadioTower size={36} strokeWidth={1.5} aria-hidden="true" />
          </div>
          {/* Pulse ring animation */}
          <div className="empty-pulse-ring" aria-hidden="true" />
        </div>
        <h2 id="empty-heading">{t('awaitingData')}</h2>
        <p>{t(emptyMessages[section])}</p>
        {/* Offline mode badge */}
        <div className="workspace-mode-badge">
          <Wifi size={12} aria-hidden="true" />
          <span>Preview Mode</span>
        </div>
      </section>

      {/* Official Data Sources Cards */}
      <section className="sources" aria-labelledby="sources-heading">
        <h2 id="sources-heading">{t('officialSources')}</h2>
        <div className="source-grid">
          <article className="source-card">
            <Database size={22} aria-hidden="true" />
            <div>
              <h3>CRC</h3>
              <p>{t('crcDescription')}</p>
            </div>
          </article>
          <article className="source-card">
            <MapPinned size={22} aria-hidden="true" />
            <div>
              <h3>DANE</h3>
              <p>{t('daneDescription')}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
