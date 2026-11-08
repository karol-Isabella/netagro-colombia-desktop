import { Link } from 'react-router-dom'
import { useTranslation } from '@renderer/i18n/useTranslation'

export function NotFoundPage() {
  const t = useTranslation()
  return <div className="page"><header className="page-header"><h1>{t('notFound')}</h1><p>{t('notFoundDescription')}</p></header><Link className="text-link" to="/">{t('backHome')}</Link></div>
}
