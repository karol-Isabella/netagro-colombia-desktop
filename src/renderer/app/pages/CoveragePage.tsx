import { lazy, Suspense, useEffect, useState } from 'react'
import { Compass, ChevronRight, Layers, SlidersHorizontal } from 'lucide-react'
import { technologies, type Layer } from '@shared/coverage'
import { useCoverageStore, type LegendBand } from '@renderer/services/coverageStore'
import { searchTerritories, territoryView } from '@renderer/services/selectors'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { WorkspacePage } from './WorkspacePage'
import { TerritoryPanel } from '@renderer/components/TerritoryPanel'

const CoverageMap = lazy(() =>
  import('@renderer/components/CoverageMap').then((module) => ({ default: module.CoverageMap }))
)

export function CoveragePage({ title = 'map' }: { title?: 'map' | 'coverage' | 'overview' }) {
  const state = useCoverageStore()
  const t = useTranslation()
  const { load } = state
  const [query, setQuery] = useState('')

  useEffect(() => {
    void load()
  }, [load])

  if (state.status === 'preview') return <WorkspacePage section={title} />

  if (!state.data || !state.maps) {
    return (
      <div className="page">
        <h1>{t(title)}</h1>
        <p role="status" className="text-sm text-[var(--muted)] my-4">
          {t(state.status === 'error' ? 'dataError' : 'loadingData')}
        </p>
        {state.status === 'error' && (
          <button className="action-button" onClick={() => void state.load()}>
            {t('retry')}
          </button>
        )}
      </div>
    )
  }

  const { territory, crumbs, children } = territoryView(state.data, state.selectedId)
  const results = searchTerritories(state.data, query)

  return (
    <div className="page data-page">
      <aside className="map-explorer">
      <header className="page-header">
        <span className="eyebrow">{state.data.metadata.period} · CRC / DANE</span>
        <h1>{t(title)}</h1>
        <p>{t('mapDescription')}</p>
      </header>

      {/* Modern Breadcrumb Trail */}
      <nav className="breadcrumbs" aria-label={t('breadcrumb')}>
        {crumbs.map((c, i) => (
          <div key={c.id} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-[var(--muted)] shrink-0" />}
            <button
              onClick={() => state.select(c.id)}
              aria-current={c.id === territory.id ? 'location' : undefined}
            >
              {c.name}
            </button>
          </div>
        ))}
      </nav>

      {/* Map Toolbar & Search */}
      <div className="map-toolbar">
        <label className="search-label">
          <span>{t('search')}</span>
          <div className="relative">
            <input
              placeholder={t('searchHint')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </label>
        <button className="action-button" onClick={() => state.select('52')}>
          <Compass size={16} aria-hidden="true" />
          <span>{t('focusNarino')}</span>
        </button>
      </div>

      {/* Autocomplete Search Results */}
      {query.trim() && (
        <ul className="search-results">
          {results.length ? (
            results.map((result) => (
              <li key={result.id}>
                <button
                  onClick={() => {
                    state.select(result.id)
                    setQuery('')
                  }}
                >
                  <span className="font-semibold">{result.name}</span> ·{' '}
                  <span className="text-[var(--muted)]">{result.id}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="p-3 text-xs text-[var(--muted)]">{t('noMatches')}</li>
          )}
        </ul>
      )}

      <section className="selected-territory-card">
        <span className="selected-territory-label">{t('noSelection')}</span>
        <TerritoryPanel />
      </section>

      {/* Layer Pill Selector */}
      <fieldset className="layer-picker">
        <legend className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] mb-2">
          <Layers size={13} />
          <span>{t('technology')}</span>
        </legend>
        {[...technologies, 'none' as const].map((layer) => (
          <button
            key={layer}
            aria-pressed={layer === state.layer}
            onClick={() => state.setLayer(layer as Layer)}
          >
            {layer === 'none' ? t('none') : layer}
          </button>
        ))}
      </fieldset>

      {/* Map Options Controls */}
      <div className="map-options">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded accent-[var(--accent)]"
            checked={state.heatmap}
            onChange={(e) => state.setHeatmap(e.target.checked)}
          />
          <span>{t('heatmap')}</span>
        </label>

        <label className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[var(--muted)]" />
          <span>{t('legend')}</span>
          <select
            value={state.band}
            onChange={(e) => state.setBand(e.target.value as LegendBand)}
          >
            <option value="all">{t('all')}</option>
            <option value="low">0–50%</option>
            <option value="medium">50–90%</option>
            <option value="high">90–100%</option>
            <option value="unknown">{t('noReport')}</option>
          </select>
        </label>
      </div>

      <p className="small-copy">{t(state.layer === 'none' ? 'noneNote' : 'methodNote')}</p>
      <p className="small-copy">{t('pointNote')}</p>

      {/* Sub-Territories Explorer */}
      {children.length > 0 && (
        <section className="territory-list">
          <h2>{t('hierarchy')}</h2>
          <div>
            {children.map((c) => (
              <button key={c.id} onClick={() => state.select(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </section>
      )}
    </aside>
      {/* Local DANE boundaries create a real, selectable territorial map without remote tiles. */}
      <section className="map-canvas-panel" aria-label={t('map')}>
        <div className="map-canvas-heading">
          <div><span className="eyebrow">{state.data.metadata.period} · DANE MGN</span><h2>{territory.name}</h2></div>
          <span className="map-live-indicator"><i /> {t('technology')}: {state.layer === 'none' ? t('none') : state.layer}</span>
        </div>
        <Suspense fallback={<div className="map-wrap map-loading-placeholder" role="status">{t('loading')}</div>}>
          <CoverageMap />
        </Suspense>
        <div className="map-legend"><span><i className="legend-low" />0–50%</span><span><i className="legend-medium" />50–90%</span><span><i className="legend-high" />90–100%</span><span><i className="legend-unknown" />{t('noReport')}</span><span><i className="legend-center-covered" />{t('coveredCenter')}</span><span><i className="legend-center-uncovered" />{t('uncoveredCenter')}</span><span className="contour-legend"><i />{t('contourLegend')}</span></div>
      </section>
    </div>
  )
}
