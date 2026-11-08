import { useState } from 'react'
import { Sparkles, Brain, CheckCircle2, Lightbulb, AlertTriangle } from 'lucide-react'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { useAnalysis } from '@renderer/services/useAnalysis'

export function AnalysisPanel() {
  const { data, selectedId, layer } = useCoverageStore()
  const { locale } = usePreferences()
  const t = useTranslation()
  const [online, setOnline] = useState(false)
  const { result, busy, failed, run } = useAnalysis(selectedId, layer, locale)

  if (!data) return null

  return (
    <section className="analysis-panel">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-[var(--accent)]" aria-hidden="true" />
        <h2 className="font-bold text-sm text-[var(--text)]">{t('analysis')}</h2>
      </div>

      <label className="small-copy flex items-center gap-2 cursor-pointer mt-1">
        <input
          type="checkbox"
          className="rounded accent-[var(--accent)] cursor-pointer"
          checked={online}
          onChange={(e) => setOnline(e.target.checked)}
        />
        <span>{t('onlineAnalysis')}</span>
      </label>

      {online && (
        <p className="small-copy text-amber-600 dark:text-amber-400 font-medium">
          {t('onlineNotice')}
        </p>
      )}

      <button
        className="action-button mt-3"
        disabled={busy}
        onClick={() => void run(online)}
      >
        <Brain size={16} aria-hidden="true" />
        <span>{t(busy ? 'analyzing' : 'analyze')}</span>
      </button>

      {failed && (
        <div className="flex items-center gap-2 text-xs text-rose-500 font-semibold mt-3" role="alert">
          <AlertTriangle size={14} />
          <span>{t('dataError')}</span>
        </div>
      )}

      {result && (
        <div className="analysis-result mt-4" aria-live="polite">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--line)]">
            <span className="eyebrow m-0 text-[10px]">
              {t(result.provider)}
              {result.model ? ' · ' + result.model : ''}
            </span>
          </div>

          <p className="text-sm font-medium text-[var(--text)] leading-relaxed mb-3">
            {result.summary}
          </p>

          <div className="mt-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
              <CheckCircle2 size={13} />
              <span>{t('findings')}</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-[var(--muted)]">
              {result.findings.map((text, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="text-[var(--accent)] font-bold">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
              <Lightbulb size={13} />
              <span>{t('recommendations')}</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-[var(--muted)]">
              {result.recommendations.map((text, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {result.fallbackReason && (
            <p className="small-copy text-[10.5px] italic mt-3 pt-2 border-t border-[var(--line)]">
              {t('fallbackNotice')}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
