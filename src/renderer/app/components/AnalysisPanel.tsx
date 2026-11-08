import { useState } from 'react'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { useAnalysis } from '@renderer/services/useAnalysis'
export function AnalysisPanel() {
  const { data,selectedId,layer } = useCoverageStore()
  const { locale } = usePreferences()
  const t = useTranslation(), [online,setOnline] = useState(false)
  const { result,busy,failed,run } = useAnalysis(selectedId,layer,locale)
  if (!data) return null
  return <section className="analysis-panel"><h2>{t('analysis')}</h2>
    <label className="small-copy"><input type="checkbox" checked={online} onChange={e => setOnline(e.target.checked)} /> {t('onlineAnalysis')}</label>
    {online && <p className="small-copy">{t('onlineNotice')}</p>}
    <button className="action-button" disabled={busy} onClick={() => void run(online)}>{t(busy ? 'analyzing' : 'analyze')}</button>
    {failed && <p role="alert">{t('dataError')}</p>}
    {result && <div className="analysis-result" aria-live="polite"><p className="eyebrow">{t(result.provider)}{result.model ? ' · ' + result.model : ''}</p>
      <p>{result.summary}</p><h3>{t('findings')}</h3><ul>{result.findings.map((text,index) => <li key={index}>{text}</li>)}</ul>
      <h3>{t('recommendations')}</h3><ul>{result.recommendations.map((text,index) => <li key={index}>{text}</li>)}</ul>
      {result.fallbackReason && <p className="small-copy">{t('fallbackNotice')}</p>}</div>}
  </section>
}
