import { ArrowRight, MapPinned } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'

type AuthMode = 'login' | 'register'

export function LandingPage({ hasAccounts, onChoose }: { hasAccounts: boolean; onChoose: (mode: AuthMode) => void }) {
  const t = useTranslation()
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a href="#inicio" className="landing-brand">
          <img src="./netagro-mark.svg" alt="" />
          <span>NetAgro <small>COLOMBIA</small></span>
        </a>
        <div className="landing-nav-actions">
          <button type="button" className="landing-login-link" onClick={() => onChoose('login')}>{t('login')}</button>
          <button type="button" className="landing-register-button" onClick={() => onChoose('register')}>{hasAccounts ? t('register') : t('landingGetStarted')}<ArrowRight size={15} /></button>
        </div>
      </header>

      <section className="landing-hero" id="inicio">
        <div className="landing-hero-copy">
          <h1>{t('landingTitle')}</h1>
          <p>{t('landingDescription')}</p>
          <div className="landing-hero-actions">
            <button type="button" className="landing-primary-button" onClick={() => onChoose(hasAccounts ? 'login' : 'register')}>
              {hasAccounts ? t('login') : t('landingGetStarted')}<ArrowRight size={17} />
            </button>
            <span>{t('landingLocalNote')}</span>
          </div>
          <div className="landing-proof"><span><i />{t('landingOffline')}</span><span><i />CRC · DANE</span><span><i />{t('landingColombia')}</span></div>
        </div>
        <div className="landing-hero-visual" aria-label={t('landingVisualLabel')}>
          <img src="./NetAgro.png" alt="" />
          <div className="landing-visual-gradient" />
          <div className="landing-map-chip"><MapPinned size={15} />{t('landingMapChip')}</div>
          <div className="landing-visual-caption"><span>NETAGRO · COLOMBIA</span><strong>{t('landingVisualCaption')}</strong></div>
          <div className="landing-coordinate">4° 34′ N · 74° 04′ O</div>
        </div>
      </section>

    </main>
  )
}
