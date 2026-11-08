import { useId } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { localeSchema, type Theme } from '@shared/contracts'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'

const themes = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const satisfies ReadonlyArray<{ value: Theme; icon: typeof Sun }>

export function PreferencesPanel() {
  const t = useTranslation()
  const { theme, locale, update, persistenceFailed } = usePreferences()
  const id = useId()
  return (
    <section className="preferences-panel" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{t('appearance')}</h2>
      <fieldset className="theme-picker">
        <legend>{t('theme')}</legend>
        <div className="theme-options">
          {themes.map(({ value, icon: Icon }) => (
            <label key={value} className={theme === value ? 'theme-option selected' : 'theme-option'}>
              <input type="radio" name={`${id}-theme`} value={value} checked={theme === value}
                onChange={() => update({ theme: value })} />
              <Icon size={18} aria-hidden="true" />
              <span>{t(value)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="language-label" htmlFor={`${id}-language`}>{t('language')}</label>
      <select id={`${id}-language`} value={locale}
        onChange={(event) => update({ locale: localeSchema.parse(event.target.value) })}>
        <option value="es" lang="es">Español</option>
        <option value="en" lang="en">English</option>
      </select>
      <p className="small-copy">{t('preferencesDescription')}</p>
      {persistenceFailed && <p role="status" className="storage-warning">{t('storageWarning')}</p>}
    </section>
  )
}
