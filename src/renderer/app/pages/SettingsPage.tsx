import { Info, FileSpreadsheet, LogOut, UserRound } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { PreferencesPanel } from '@renderer/components/PreferencesPanel'
import { useAppInfo } from '@renderer/services/useAppInfo'
import { AiSettingsPanel } from '@renderer/components/AiSettingsPanel'
import { useAuthStore } from '@renderer/services/authStore'

export function SettingsPage() {
  const t = useTranslation()
  const state = useAppInfo()
  const { username, logout } = useAuthStore()

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">NETAGRO</span>
        <h1>{t('settings')}</h1>
        <p>{t('settingsDescription')}</p>
      </header>

      {/* Main Preferences Card */}
      <div className="settings-card">
        <PreferencesPanel />
      </div>

      <AiSettingsPanel />

      {/* About Application Metadata */}
      <section className="settings-card about-card">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-base font-bold text-[var(--text)]">{t('about')}</h2>
        </div>
        {state.status === 'ready' ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="font-medium text-[var(--text)]">
              {state.info.name} · {t('version')} {state.info.version}
            </p>
            <span
              aria-hidden="true"
              className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold tracking-wide"
            >
              v{state.info.version}
            </span>
          </div>
        ) : (
          <p role="status" className="text-sm text-[var(--muted)]">
            {t(
              state.status === 'loading'
                ? 'loading'
                : state.status === 'preview'
                  ? 'preview'
                  : 'desktopUnavailable'
            )}
          </p>
        )}
      </section>

      <section className="settings-card methodology settings-methodology">
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet size={18} className="text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-base font-bold text-[var(--text)]">{t('dataset')}</h2>
        </div>
        <p className="font-medium text-[var(--text)]">{t('sourceNote')}</p>
        <p className="small-copy">{t('methodNote')}</p>
        <p className="small-copy">{t('pointNote')}</p>
      </section>

      <section className="settings-card session-card">
        <div className="session-identity"><UserRound size={17} aria-hidden="true" /><span>{username}</span></div>
        <button className="session-logout" type="button" onClick={() => void logout()}>
          <LogOut size={15} aria-hidden="true" /><span>{t('logout')}</span>
        </button>
      </section>
    </div>
  )
}
