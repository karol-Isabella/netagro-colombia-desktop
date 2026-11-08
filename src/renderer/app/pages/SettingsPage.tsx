import { useTranslation } from '@renderer/i18n/useTranslation'
import { PreferencesPanel } from '@renderer/components/PreferencesPanel'
import { useAppInfo } from '@renderer/services/useAppInfo'

export function SettingsPage() {
  const t = useTranslation()
  const state = useAppInfo()
  return (
    <div className="page">
      <header className="page-header"><p className="eyebrow">NETAGRO</p><h1>{t('settings')}</h1><p>{t('settingsDescription')}</p></header>
      <div className="settings-card"><PreferencesPanel /></div>
      <section className="settings-card about-card">
        <h2>{t('about')}</h2>
        {state.status === 'ready' ? <p>{state.info.name} · {t('version')} {state.info.version}</p> :
          <p role="status">{t(state.status === 'loading' ? 'loading' : state.status === 'preview' ? 'preview' : 'desktopUnavailable')}</p>}
      </section>
    </div>
  )
}
