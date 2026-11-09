import { useEffect, useState } from 'react'
import { Download, Table, Filter, ChevronDown, TrendingUp } from 'lucide-react'
import { technologies, layerValue, type Layer } from '@shared/coverage'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { rankings, percent } from '@renderer/services/selectors'
import { useExport } from '@renderer/services/useExport'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'

/** Returns a semantic coverage tier dot color */
function coverageDot(value: number | null | undefined): string {
  if (value === undefined || value === null || value < 0) return 'coverage-dot unknown'
  if (value >= 0.9) return 'coverage-dot high'
  if (value >= 0.5) return 'coverage-dot medium'
  return 'coverage-dot low'
}

export function ReportsPage() {
  const { data, status, load, selectedId, select, layer, setLayer } = useCoverageStore()
  const { locale } = usePreferences()
  const t = useTranslation()
  const exportTask = useExport()
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    void load()
  }, [load])

  if (!data) {
    return (
      <div className="page">
        <h1>{t('reports')}</h1>
        <p role="status" className="text-sm text-[var(--muted)] my-4">
          {t(
            status === 'error'
              ? 'dataError'
              : status === 'preview'
                ? 'needDesktop'
                : 'loadingData'
          )}
        </p>
        <button className="action-button" onClick={() => void load()}>
          {t('retry')}
        </button>
      </div>
    )
  }

  const rows = rankings(data, selectedId, layer)

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">{data.metadata.period}</span>
        <h1>{t('ranking')}</h1>
        <p>{t('rankingNote')}</p>
      </header>

      {/* Filter Toolbar */}
      <div className="report-filters">
        <label>
          <span className="flex items-center gap-1.5">
            <Filter size={13} />
            <span>{t('breadcrumb')}</span>
          </span>
          <select
            value={selectedId}
            onChange={(e) => {
              select(e.target.value)
              setLimit(50)
            }}
          >
            {data.territories
              .filter((t) => t.level !== 'municipality' || t.id === selectedId)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>

        <label>
          <span>{t('technology')}</span>
          <select
            value={layer}
            onChange={(e) => {
              setLayer(e.target.value as Layer)
              setLimit(50)
            }}
          >
            {[...technologies, 'none'].map((value) => (
              <option key={value} value={value}>
                {value === 'none' ? t('none') : value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="small-copy">
        {t('reportCount')}: <strong className="text-[var(--text)]">{rows.length}</strong>
      </p>

      {/* Export Buttons */}
      <div className="export-actions">
        <button
          className="action-button"
          disabled={exportTask.status === 'busy'}
          onClick={() => void exportTask.run(selectedId, layer, 'rankings')}
        >
          <Download size={15} aria-hidden="true" />
          <span>{t('exportCsv')}</span>
        </button>
        <button
          className="action-button"
          disabled={exportTask.status === 'busy'}
          onClick={() => void exportTask.run(selectedId, layer, 'centers')}
        >
          <Table size={15} aria-hidden="true" />
          <span>{t('exportCenters')}</span>
        </button>
      </div>

      {exportTask.status !== 'idle' && (
        <p role="status" className="text-xs font-semibold text-[var(--accent)] my-2">
          {t(exportTask.status === 'busy' ? 'loading' : exportTask.status)}
        </p>
      )}

      {/* Modern SaaS Table */}
      <div className="table-wrap">
        <table>
          <caption>
            <span className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[var(--accent)]" aria-hidden="true" />
              {t('ranking')} · {data.metadata.period}
            </span>
          </caption>
          <thead>
            <tr>
              <th>DANE</th>
              <th>{t('breadcrumb')}</th>
              <th>{t('coverage')}</th>
              <th>{t('uncovered')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs text-[var(--muted)]">{row.id}</td>
                <td className="font-semibold text-[var(--text)]">{row.name}</td>
                <td>
                  <span className="flex items-center gap-2">
                    <span className={coverageDot(layerValue(row, layer))} aria-hidden="true" />
                    <span className="font-bold text-[var(--accent)]">
                      {percent(layerValue(row, layer), locale)}
                    </span>
                  </span>
                </td>
                <td>
                  <span
                    className={
                      row.uncoveredCenters > 0
                        ? 'text-rose-500 font-semibold'
                        : 'text-[var(--muted)]'
                    }
                  >
                    {row.uncoveredCenters}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {limit < rows.length && (
        <button className="action-button mt-4" onClick={() => setLimit(limit + 50)}>
          <span>{t('showMore')}</span>
          <ChevronDown size={15} />
        </button>
      )}

      <p className="small-copy">{t(layer === 'none' ? 'noneNote' : 'methodNote')}</p>
    </div>
  )
}
