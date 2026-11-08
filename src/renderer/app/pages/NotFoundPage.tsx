import { Link } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'

export function NotFoundPage() {
  const t = useTranslation()
  return (
    <div className="page flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="empty-illustration">
        <div className="empty-icon text-rose-500 bg-rose-500/10">
          <Compass size={36} aria-hidden="true" />
        </div>
      </div>
      <h1 className="text-2xl font-extrabold text-[var(--text)] mb-2">
        {t('notFound')}
      </h1>
      <p className="text-sm text-[var(--muted)] max-w-sm mb-6">
        {t('notFoundDescription')}
      </p>
      <Link
        className="action-button inline-flex items-center gap-2"
        to="/"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>{t('backHome')}</span>
      </Link>
    </div>
  )
}
