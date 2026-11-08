import { lazy, Suspense, useEffect, useState } from 'react'
import { technologies, type Layer } from '@shared/coverage'
import { useCoverageStore, type LegendBand } from '@renderer/services/coverageStore'
import { searchTerritories, territoryView } from '@renderer/services/selectors'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { WorkspacePage } from './WorkspacePage'
const CoverageMap = lazy(() => import('@renderer/components/CoverageMap').then(module => ({ default: module.CoverageMap })))
export function CoveragePage({ title = 'map' }: { title?: 'map' | 'coverage' | 'overview' }) {
  const state = useCoverageStore(), t = useTranslation()
  const { load } = state
  const [query, setQuery] = useState('')
  useEffect(() => { void load() }, [load])
  if (state.status === 'preview') return <WorkspacePage section={title} />
  if (!state.data || !state.maps) return <div className="page"><h1>{t(title)}</h1><p role="status">{t(state.status === 'error' ? 'dataError' : 'loadingData')}</p>
    {state.status === 'error' && <button className="action-button" onClick={() => void state.load()}>{t('retry')}</button>}</div>
  const { territory, crumbs, children } = territoryView(state.data,state.selectedId)
  const results = searchTerritories(state.data,query)
  return <div className="page data-page">
    <header className="page-header"><p className="eyebrow">{state.data.metadata.period} · CRC / DANE</p><h1>{t(title)}</h1></header>
    <nav className="breadcrumbs" aria-label={t('breadcrumb')}>{crumbs.map(c => <button key={c.id} onClick={() => state.select(c.id)} aria-current={c.id === territory.id ? 'location' : undefined}>{c.name}</button>)}</nav>
    <div className="map-toolbar">
      <label className="search-label">{t('search')}<input placeholder={t('searchHint')} value={query} onChange={e => setQuery(e.target.value)} /></label>
      <button className="action-button" onClick={() => state.select('52')}>{t('focusNarino')}</button>
    </div>
    {query.trim() && <ul className="search-results">{results.length ? results.map(result =>
      <li key={result.id}><button onClick={() => { state.select(result.id); setQuery('') }}>{result.name} · {result.id}</button></li>) : <li>{t('noMatches')}</li>}</ul>}
    <fieldset className="layer-picker"><legend>{t('technology')}</legend>{[...technologies,'none' as const].map(layer =>
      <button key={layer} aria-pressed={layer === state.layer} onClick={() => state.setLayer(layer as Layer)}>{layer === 'none' ? t('none') : layer}</button>)}</fieldset>
    <Suspense fallback={<p role="status">{t('loading')}</p>}><CoverageMap /></Suspense>
    <div className="map-options"><label><input type="checkbox" checked={state.heatmap} onChange={e => state.setHeatmap(e.target.checked)} /> {t('heatmap')}</label>
      <label>{t('legend')} <select value={state.band} onChange={e => state.setBand(e.target.value as LegendBand)}>
        <option value="all">{t('all')}</option><option value="low">0–50%</option><option value="medium">50–90%</option><option value="high">90–100%</option><option value="unknown">{t('noReport')}</option></select></label></div>
    <p className="small-copy">{t(state.layer === 'none' ? 'noneNote' : 'methodNote')}</p>
    <p className="small-copy">{t('pointNote')}</p>
    {children.length > 0 && <section className="territory-list"><h2>{t('hierarchy')}</h2><div>{children.map(c => <button key={c.id} onClick={() => state.select(c.id)}>{c.name}</button>)}</div></section>}
  </div>
}
