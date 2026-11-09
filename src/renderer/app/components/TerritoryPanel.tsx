import { MapPin, Signal, Radio, Building2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { operators, layerValue } from '@shared/coverage'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { percent, territoryView } from '@renderer/services/selectors'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { AnalysisPanel } from './AnalysisPanel'

/** Returns semantic color class based on coverage value */
function coverageColorClass(val: number | null | undefined): string {
  if (val === undefined || val === null || val < 0) return 'text-[var(--muted)]'
  if (val >= 0.9) return 'text-emerald-500 dark:text-emerald-400'
  if (val >= 0.5) return 'text-amber-500'
  return 'text-rose-500'
}

/** Returns a trend icon component based on coverage value */
function TrendIcon({ val }: { val: number | null | undefined }) {
  if (val === undefined || val === null || val < 0) return <Minus size={16} className="text-[var(--muted)]" />
  if (val >= 0.9) return <TrendingUp size={16} className="text-emerald-500" />
  if (val >= 0.5) return <Minus size={16} className="text-amber-500" />
  return <TrendingDown size={16} className="text-rose-500" />
}

export function TerritoryPanel() {
  const { data, selectedId, layer, centerId, selectCenter } = useCoverageStore()
  const { locale } = usePreferences()
  const t = useTranslation()

  if (!data) {
    return (
      <div className="territory-note">
        <div className="detail-icon">
          <MapPin size={20} aria-hidden="true" />
        </div>
        <h2>{t('noSelection')}</h2>
        <p>{t('noSelectionDescription')}</p>
      </div>
    )
  }

  const { territory, centers } = territoryView(data, selectedId)
  const center = centers.find((c) => c.id === centerId)

  return (
    <section className="territory-panel">
      <div className="flex items-center gap-2 mb-2">
        <span className="eyebrow">
          {data.metadata.period} · {territory.id}
        </span>
      </div>

      <h2>{territory.name}</h2>

      {/* Hero Metric */}
      <div className="my-4 p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--line)] transition-all duration-300">
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Signal size={13} className="text-[var(--accent)]" />
          {t(layer === 'none' ? 'layerNone' : 'bestCoverage')}
        </span>
        <div className="flex items-end gap-2 mt-1">
          <strong className={`coverage-number ${coverageColorClass(layerValue(territory, layer))}`}>
            {percent(layerValue(territory, layer), locale)}
          </strong>
          <TrendIcon val={layerValue(territory, layer)} />
        </div>
      </div>

      {/* Centers & Uncovered Summary */}
      <dl className="detail-list">
        <div>
          <dt className="flex items-center gap-1.5">
            <Building2 size={13} />
            <span>{t('centers')}</span>
          </dt>
          <dd>{territory.centerCount}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5">
            <Radio size={13} />
            <span>{t('uncovered')}</span>
          </dt>
          <dd className="text-rose-500 font-bold">{territory.uncoveredCenters}</dd>
        </div>
      </dl>

      {/* Operator Breakdown */}
      {layer !== 'none' && (
        <div className="mt-4">
          <h3>{t('operatorBreakdown')}</h3>
          <dl className="detail-list">
            {operators.map((op) => (
              <div key={op}>
                <dt>{op}</dt>
                <dd>{percent(territory.operators[op][layer], locale)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Center Detail Selected */}
      {center && (
        <div className="center-detail">
          <h3 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-1">
            {t('centerDetail')}
          </h3>
          <p className="font-semibold text-[var(--text)]">
            {center.name} · <span className="text-[var(--muted)]">{center.id}</span>
          </p>
          <p className="text-base font-bold text-[var(--accent)] mt-1">
            {percent(
              layer === 'none' ? (center.none ? 1 : 0) : center.coverage[layer],
              locale
            )}
          </p>
          <p className="small-copy">{t('pointNote')}</p>
        </div>
      )}

      {/* AI Diagnosis Action */}
      <AnalysisPanel />

      {/* Weak Zones List */}
      <section className="weak-centers mt-6">
        <h3 className="font-bold text-xs uppercase text-[var(--muted)] tracking-wider mb-2">
          {t('weakZones')}
        </h3>
        {centers.some((c) => c.none) ? (
          <ul>
            {centers
              .filter((c) => c.none)
              .slice(0, 20)
              .map((c) => (
                <li key={c.id}>
                  <button onClick={() => selectCenter(c.id)}>
                    {c.name} · {c.id}
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p className="small-copy">{t('noWeak')}</p>
        )}
      </section>
    </section>
  )
}
