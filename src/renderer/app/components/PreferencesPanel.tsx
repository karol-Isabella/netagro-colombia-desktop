import { useId } from 'react'
import { Sun, Moon, Monitor, Globe, Palette } from 'lucide-react'
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
      <div className="flex items-center gap-2 mb-3">
        <Palette size={16} className="text-[var(--accent)]" aria-hidden="true" />
        <h2 id={`${id}-heading`} className="font-bold text-sm text-[var(--text)]">
          {t('appearance')}
        </h2>
      </div>

      {/* Apple-style Segmented Theme Control */}
      <fieldset className="theme-picker">
        <legend className="sr-only">{t('theme')}</legend>
        <div className="theme-options">
          {themes.map(({ value, icon: Icon }) => (
            <label
              key={value}
              className={theme === value ? 'theme-option selected' : 'theme-option'}
            >
              <input
                type="radio"
                name={`${id}-theme`}
                value={value}
                checked={theme === value}
                onChange={() => update({ theme: value })}
              />
              <Icon size={16} aria-hidden="true" />
              <span>{t(value)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Language Selector */}
      <div className="mt-4">
        <label className="language-label flex items-center gap-1.5" htmlFor={`${id}-language`}>
          <Globe size={13} className="text-[var(--muted)]" aria-hidden="true" />
          <span>{t('language')}</span>
        </label>
        <select
          id={`${id}-language`}
          value={locale}
          aria-label={t('language')}
          onChange={(event) => update({ locale: localeSchema.parse(event.target.value) })}
        >
          <option value="es" lang="es">
            Español
          </option>
          <option value="en" lang="en">
            English
          </option>
        </select>
      </div>

      <p className="small-copy">{t('preferencesDescription')}</p>
      {persistenceFailed && (
        <p role="status" className="storage-warning">
          {t('storageWarning')}
        </p>
      )}
    </section>
  )
}
