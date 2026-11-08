import { useEffect, useState } from 'react'
import { technologies, layerValue, type Layer } from '@shared/coverage'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { rankings, percent } from '@renderer/services/selectors'
import { useExport } from '@renderer/services/useExport'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
export function ReportsPage() {
  const { data,status,load,selectedId,select,layer,setLayer } = useCoverageStore()
  const { locale } = usePreferences(), t = useTranslation()
  const exportTask = useExport()
  const [limit,setLimit] = useState(50)
  useEffect(() => { void load() },[load])
  if (!data) return <div className="page"><h1>{t('reports')}</h1><p role="status">{t(status === 'error' ? 'dataError' : status === 'preview' ? 'needDesktop' : 'loadingData')}</p><button onClick={() => void load()}>{t('retry')}</button></div>
  const rows = rankings(data,selectedId,layer)
  return <div className="page"><header className="page-header"><p className="eyebrow">{data.metadata.period}</p><h1>{t('ranking')}</h1><p>{t('rankingNote')}</p></header>
    <div className="report-filters"><label>{t('breadcrumb')}<select value={selectedId} onChange={e => { select(e.target.value); setLimit(50) }}>
      {data.territories.filter(t => t.level !== 'municipality' || t.id === selectedId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>{t('technology')}<select value={layer} onChange={e => { setLayer(e.target.value as Layer); setLimit(50) }}>{[...technologies,'none'].map(value => <option key={value} value={value}>{value === 'none' ? t('none') : value}</option>)}</select></label></div>
    <p className="small-copy">{t('reportCount')}: {rows.length}</p>
    <div className="export-actions"><button className="action-button" disabled={exportTask.status === 'busy'} onClick={() => void exportTask.run(selectedId,layer,'rankings')}>{t('exportCsv')}</button>
      <button className="action-button" disabled={exportTask.status === 'busy'} onClick={() => void exportTask.run(selectedId,layer,'centers')}>{t('exportCenters')}</button></div>
    {exportTask.status !== 'idle' && <p role="status">{t(exportTask.status === 'busy' ? 'loading' : exportTask.status)}</p>}
    <div className="table-wrap"><table><caption>{t('ranking')} · {data.metadata.period}</caption><thead><tr><th>DANE</th><th>{t('breadcrumb')}</th><th>{t('coverage')}</th><th>{t('uncovered')}</th></tr></thead>
      <tbody>{rows.slice(0,limit).map(row => <tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{percent(layerValue(row,layer),locale)}</td><td>{row.uncoveredCenters}</td></tr>)}</tbody></table></div>
    {limit < rows.length && <button className="action-button" onClick={() => setLimit(limit+50)}>{t('showMore')}</button>}
    <p className="small-copy">{t(layer === 'none' ? 'noneNote' : 'methodNote')}</p>
  </div>
}
