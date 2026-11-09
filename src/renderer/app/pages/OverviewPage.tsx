import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Radio, MapPin, Signal, ArrowRight, Layers, FileSpreadsheet } from 'lucide-react'
import { technologies } from '@shared/coverage'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { percent } from '@renderer/services/selectors'
import { usePreferences } from '@renderer/preferences/usePreferences'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { CoveragePage } from './CoveragePage'

export function OverviewPage() {
  const { data, load, select } = useCoverageStore()
  const { locale } = usePreferences()
  const t = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    void load()
  }, [load])

  if (!data) return <CoveragePage title="overview" />

  const country = data.territories[0]

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">{data.metadata.period} · CRC / DANE</span>
        <h1>{t('overview')}</h1>
        <p>{t('overviewDescription')}</p>
      </header>

      {/* Modern SaaS KPI Stats Grid */}
      <div className="stats-grid">
        <article>
          <div className="flex items-center justify-between mb-3">
            <p>{t('centers')}</p>
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <strong>{country.centerCount.toLocaleString(locale)}</strong>
        </article>

        <article>
          <div className="flex items-center justify-between mb-3">
            <p>{t('uncovered')}</p>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Radio size={16} />
            </div>
          </div>
          <strong className="text-rose-500">
            {country.uncoveredCenters.toLocaleString(locale)}
          </strong>
        </article>

        <article>
          <div className="flex items-center justify-between mb-3">
            <p>{t('area')}</p>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <MapPin size={16} />
            </div>
          </div>
          <strong>
            {new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(country.area)}
            <span className="text-xs font-normal text-[var(--muted)] ml-1">km²</span>
          </strong>
        </article>

        <article>
          <div className="flex items-center justify-between mb-3">
            <p>4G LTE</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Signal size={16} />
            </div>
          </div>
          <strong className="text-[var(--accent)]">
            {percent(country.coverage['4G'], locale)}
          </strong>
        </article>
      </div>

      {/* Technology Breakdown Card */}
      <section className="settings-card">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text)]">{t('national')}</h2>
        </div>
        <p className="small-copy mt-0">{t('methodNote')}</p>

        <div className="technology-bars">
          {technologies.map((tech) => {
            const val = country.coverage[tech] ?? 0
            const colorClass =
              val >= 0.9 ? 'bar-high' : val >= 0.5 ? 'bar-medium' : 'bar-low'
            return (
              <div key={tech}>
                <span className="font-semibold text-xs text-[var(--muted)] w-10">{tech}</span>
                <progress
                  max={1}
                  value={val}
                  aria-label={tech}
                  className={colorClass}
                />
                <strong>{percent(country.coverage[tech], locale)}</strong>
              </div>
            )
          })}
        </div>

        <button
          className="action-button mt-4"
          onClick={() => {
            select('CO')
            navigate('/map')
          }}
        >
          <span>{t('map')}</span>
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Departments Explorer */}
      <section className="territory-list">
        <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-3">
          {t('hierarchy')}
        </h2>
        <div>
          {data.territories
            .filter((t) => t.level === 'department')
            .map((region) => (
              <button
                key={region.id}
                onClick={() => {
                  select(region.id)
                  navigate('/map')
                }}
              >
                {region.name}
              </button>
            ))}
        </div>
      </section>

      {/* Dataset & Methodology Info */}
      <section className="settings-card methodology mt-8">
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text)]">{t('dataset')}</h2>
        </div>
        <p className="text-sm font-medium text-[var(--text)]">
          {t('sourceNote')} · {data.metadata.period}
        </p>
        <p className="small-copy">{t('methodNote')}</p>
        <p className="small-copy">{t('pointNote')}</p>
      </section>
    </div>
  )
}
