import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Brain, CheckCircle2, Lightbulb, AlertTriangle, ChevronDown } from 'lucide-react'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { useAnalysis } from '@renderer/services/useAnalysis'

export function AnalysisPanel() {
  const { data, selectedId, layer } = useCoverageStore()
  const { locale } = usePreferences()
  const t = useTranslation()
  const [online, setOnline] = useState(false)
  const [hasAiKey, setHasAiKey] = useState<boolean | null>(null)
  const { result, busy, failed, run } = useAnalysis(selectedId, layer, locale)

  useEffect(() => {
    let mounted = true
    void window.netAgro?.aiKeyStatus?.().then((response) => {
      if (mounted && response.ok) setHasAiKey(response.data.configured)
    }).catch(() => undefined)
    return () => { mounted = false }
  }, [])

  if (!data) return null

  return (
    <section className="analysis-panel">
      <div className="analysis-heading">
        <span className="analysis-heading-icon"><Sparkles size={15} aria-hidden="true" /></span>
        <h2>{t('analysis')}</h2>
      </div>

      <label className="analysis-mode-control">
        <input
          type="checkbox"
          className="accent-[var(--accent)] cursor-pointer"
          checked={online}
          onChange={(e) => setOnline(e.target.checked)}
        />
        <span className="analysis-mode-copy">
          <strong>{t('onlineAnalysis')}</strong>
          <small>{online ? 'Gemini 3.5 Flash-Lite' : t('rules')}</small>
        </span>
      </label>

      {online && (
        <p className="analysis-online-notice">
          {t('onlineNotice')}
        </p>
      )}

      {online && hasAiKey === false && (
        <p className="analysis-key-warning" role="status">
          {t('aiKeyMissing')} · <Link className="text-link" to="/settings">{t('settings')}</Link>
        </p>
      )}

      <button
        className="action-button mt-3"
        disabled={busy}
        onClick={() => void run(online)}
      >
        {busy ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
            <span>{t('analyzing')}</span>
          </>
        ) : (
          <>
            <Brain size={16} aria-hidden="true" />
            <span>{t('analyze')}</span>
          </>
        )}
      </button>

      {busy && (
        <div className="analysis-skeleton mt-4" aria-hidden="true">
          <div className="skeleton-line w-3/4" />
          <div className="skeleton-line w-full" />
          <div className="skeleton-line w-5/6" />
        </div>
      )}

      {failed && (
        <div className="flex items-center gap-2 text-xs text-rose-500 font-semibold mt-3" role="alert">
          <AlertTriangle size={14} />
          <span>{t('dataError')}</span>
        </div>
      )}

      {result && (
        <div className="analysis-result" aria-live="polite">
          <div className="analysis-result-header">
            <span className={`analysis-provider-dot ${result.provider === 'gemini' ? 'is-online' : ''}`} />
            <strong>{result.provider === 'gemini' ? 'Gemini' : t(result.provider)}</strong>
            {result.model && <span className="analysis-model-name">{result.model}</span>}
          </div>

          <p className="analysis-summary">
            {result.summary}
          </p>

          <details className="analysis-disclosure">
            <summary>
              <span><CheckCircle2 size={14} />{t('findings')}</span>
              <span className="analysis-disclosure-meta">{result.findings.length}<ChevronDown size={14} /></span>
            </summary>
            <ul className="analysis-points">
              {result.findings.map((text, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="analysis-point-mark" aria-hidden="true">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </details>

          <details className="analysis-disclosure recommendations-disclosure">
            <summary>
              <span><Lightbulb size={14} />{t('recommendations')}</span>
              <span className="analysis-disclosure-meta">{result.recommendations.length}<ChevronDown size={14} /></span>
            </summary>
            <ul className="analysis-points">
              {result.recommendations.map((text, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="analysis-point-mark" aria-hidden="true">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </details>

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
