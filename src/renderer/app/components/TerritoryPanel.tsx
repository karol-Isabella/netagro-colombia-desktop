import { operators, layerValue } from '@shared/coverage'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { percent, territoryView } from '@renderer/services/selectors'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { AnalysisPanel } from './AnalysisPanel'
export function TerritoryPanel() {
  const { data, selectedId, layer, centerId } = useCoverageStore()
  const { locale } = usePreferences()
  const t = useTranslation()
  if (!data) return <div className="territory-note"><h2>{t('noSelection')}</h2><p>{t('noSelectionDescription')}</p></div>
  const { territory, centers } = territoryView(data,selectedId)
  const center = centers.find(c => c.id === centerId)
  return <section className="territory-panel">
    <p className="eyebrow">{data.metadata.period} · {territory.id}</p><h2>{territory.name}</h2>
    <strong className="coverage-number">{percent(layerValue(territory,layer),locale)}</strong>
    <p className="small-copy">{t(layer === 'none' ? 'layerNone' : 'bestCoverage')}</p>
    <dl className="detail-list"><div><dt>{t('centers')}</dt><dd>{territory.centerCount}</dd></div>
      <div><dt>{t('uncovered')}</dt><dd>{territory.uncoveredCenters}</dd></div></dl>
    {layer !== 'none' && <><h3>{t('operatorBreakdown')}</h3><dl className="detail-list">{operators.map(op =>
      <div key={op}><dt>{op}</dt><dd>{percent(territory.operators[op][layer],locale)}</dd></div>)}</dl></>}
    <p className="small-copy">{t(layer === 'none' ? 'noneNote' : 'methodNote')}</p>
    {center && <div className="center-detail"><h3>{t('centerDetail')}</h3><p>{center.name} · {center.id}</p>
      <p>{percent(layer === 'none' ? (center.none ? 1 : 0) : center.coverage[layer],locale)}</p><p className="small-copy">{t('pointNote')}</p></div>}
    <AnalysisPanel />
  </section>
}
