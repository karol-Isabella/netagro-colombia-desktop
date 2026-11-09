import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, Building2, MapPinned, RadioTower, Signal } from 'lucide-react'
import { layerValue, rankTerritories, technologies, type Layer } from '@shared/coverage'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { percent } from '@renderer/services/selectors'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { WorkspacePage } from './WorkspacePage'

export function CoverageOverviewPage() {
  const { data, status, load, layer, setLayer, select } = useCoverageStore()
  const { locale } = usePreferences()
  const t = useTranslation()
  const navigate = useNavigate()

  useEffect(() => { void load() }, [load])

  if (!data) {
    if (status === 'preview') return <WorkspacePage section="coverage" />
    return <div className="page"><h1>{t('coverage')}</h1><p role="status" className="small-copy">{t(status === 'error' ? 'dataError' : 'loadingData')}</p></div>
  }

  const country = data.territories.find((territory) => territory.level === 'country')!
  const departments = rankTerritories(data.territories.filter((territory) => territory.level === 'department'), layer)
  const value = (territory: typeof country) => layerValue(territory, layer)

  return (
    <div className="page coverage-overview">
      <header className="page-header">
        <span className="eyebrow">{data.metadata.period} · CRC / DANE</span>
        <h1>{t('coverage')}</h1>
        <p>{t('coverageDescription')}</p>
      </header>

      <section className="coverage-hero-card">
        <div className="coverage-hero-copy">
          <span className="coverage-hero-icon"><RadioTower size={19} /></span>
          <div><span className="coverage-section-kicker">{t('national')}</span><h2>{country.name}</h2><p>{t('methodNote')}</p></div>
        </div>
        <div className="coverage-hero-value"><strong>{percent(value(country), locale)}</strong><span>{layer === 'none' ? t('none') : `${layer} ${t('coverage').toLowerCase()}`}</span></div>
        <div className="coverage-hero-decoration" aria-hidden="true"><Signal size={112} strokeWidth={.8} /></div>
      </section>

      <div className="coverage-summary-grid">
        <article><span className="coverage-summary-icon"><Building2 size={17} /></span><span>{t('centers')}</span><strong>{country.centerCount.toLocaleString(locale)}</strong></article>
        <article><span className="coverage-summary-icon coverage-summary-icon-warm"><ArrowDownRight size={17} /></span><span>{t('uncovered')}</span><strong>{country.uncoveredCenters.toLocaleString(locale)}</strong></article>
        <article><span className="coverage-summary-icon coverage-summary-icon-lime"><MapPinned size={17} /></span><span>{t('hierarchy')}</span><strong>{departments.length}</strong></article>
      </div>

      <section className="coverage-ranking-card">
        <div className="coverage-ranking-heading"><div><span className="coverage-section-kicker">{t('technology')}</span><h2>{t('coverageByDepartment')}</h2></div>
          <label className="coverage-layer-select"><span className="sr-only">{t('technology')}</span><select value={layer} onChange={(event) => setLayer(event.target.value as Layer)}>{[...technologies, 'none'].map((item) => <option key={item} value={item}>{item === 'none' ? t('none') : item}</option>)}</select></label>
        </div>
        <p className="small-copy">{t('rankingNote')}</p>
        <div className="coverage-department-list">
          {departments.map((department, index) => {
            const coverage = value(department)
            return <button className="coverage-department-row" key={department.id} onClick={() => { select(department.id); navigate('/map') }}>
              <span className="coverage-rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="coverage-department-name">{department.name}<small>{department.centerCount.toLocaleString(locale)} {t('centers').toLowerCase()}</small></span>
              <span className="coverage-bar-track"><i style={{ width: `${coverage === null ? 0 : Math.max(0, Math.min(100, coverage * 100))}%` }} /></span>
              <strong className={coverage === null ? 'coverage-value-missing' : ''}>{percent(coverage, locale)}</strong>
              <ArrowRight size={15} className="coverage-row-arrow" />
            </button>
          })}
        </div>
        <p className="small-copy">{t('methodNote')}</p>
      </section>
    </div>
  )
}
