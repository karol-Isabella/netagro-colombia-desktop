import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { technologies } from '@shared/coverage'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { percent } from '@renderer/services/selectors'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { CoveragePage } from './CoveragePage'
export function OverviewPage() {
  const { data,load,select } = useCoverageStore(), { locale } = usePreferences(), t = useTranslation()
  const navigate = useNavigate()
  useEffect(() => { void load() },[load])
  if (!data) return <CoveragePage title="overview" />
  const country = data.territories[0]
  return <div className="page"><header className="page-header"><p className="eyebrow">{data.metadata.period} · CRC / DANE</p><h1>{t('overview')}</h1><p>{t('overviewDescription')}</p></header>
    <div className="stats-grid"><article><p>{t('centers')}</p><strong>{country.centerCount.toLocaleString(locale)}</strong></article><article><p>{t('uncovered')}</p><strong>{country.uncoveredCenters.toLocaleString(locale)}</strong></article>
      <article><p>{t('area')}</p><strong>{new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(country.area)}</strong></article><article><p>4G</p><strong>{percent(country.coverage['4G'],locale)}</strong></article></div>
    <section className="settings-card"><h2>{t('national')}</h2><p className="small-copy">{t('methodNote')}</p>
      <div className="technology-bars">{technologies.map(tech => <div key={tech}><span>{tech}</span><progress max={1} value={country.coverage[tech] ?? 0} aria-label={tech} /><strong>{percent(country.coverage[tech],locale)}</strong></div>)}</div>
      <button className="action-button" onClick={() => { select('CO'); navigate('/map') }}>{t('map')}</button></section>
    <section className="territory-list"><h2>{t('hierarchy')}</h2><div>{data.territories.filter(t => t.level === 'department').map(region =>
      <button key={region.id} onClick={() => { select(region.id); navigate('/map') }}>{region.name}</button>)}</div></section>
    <section className="settings-card methodology"><h2>{t('dataset')}</h2><p>{t('sourceNote')} · {data.metadata.period}</p><p className="small-copy">{t('methodNote')}</p><p className="small-copy">{t('pointNote')}</p></section>
  </div>
}
