import { Info } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { PreferencesPanel } from '@renderer/components/PreferencesPanel'
import { useAppInfo } from '@renderer/services/useAppInfo'
import { AiSettingsPanel } from '@renderer/components/AiSettingsPanel'

export function SettingsPage() {
  const t = useTranslation()
  const state = useAppInfo()

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
    </div>
  )
}
