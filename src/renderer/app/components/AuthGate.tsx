import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Sprout } from 'lucide-react'
import { useAuthStore } from '@renderer/services/authStore'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { PreferencesPanel } from './PreferencesPanel'
export function AuthGate({ children }: { children: ReactNode }) {
  const { status,initialize } = useAuthStore()
  const t = useTranslation()
  useEffect(() => { void initialize() }, [initialize])
  if (status === 'loading') return <p className="page" role="status">{t('loading')}</p>
  if (status === 'preview') return <>{children}</>
  if (status === 'authenticated') return <>{children}</>
  if (status === 'error') return <div className="page"><p role="alert">{t('storageError')}</p><button onClick={() => void initialize()}>{t('retry')}</button></div>
  return <AuthForm />
}
function AuthForm() {
  const { hasAccounts,busy,error,submit } = useAuthStore()
  const t = useTranslation()
  const [mode,setMode] = useState<'login' | 'register'>(hasAccounts ? 'login' : 'register')
  const [username,setUsername] = useState(''), [password,setPassword] = useState('')
  async function send(event: FormEvent) {
    event.preventDefault()
    await submit(mode,username,password)
    setPassword('')
  }
  return <main className="auth-page"><div className="auth-card">
    <div className="brand-icon"><Sprout size={28} aria-hidden="true" /></div><h1>{t('product')}</h1><p>{t('authDescription')}</p>
    <form className="auth-form" onSubmit={event => void send(event)}>
      <h2>{t(mode)}</h2>
      <label htmlFor="username">{t('username')}</label><input id="username" autoComplete="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._\-]+" value={username} onChange={e => setUsername(e.target.value)} />
      <label htmlFor="password">{t('password')}</label><input id="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={10} maxLength={128} aria-describedby="password-hint" value={password} onChange={e => setPassword(e.target.value)} />
      <p id="password-hint" className="small-copy">{t('passwordHint')}</p>
      {error && <p role="alert">{t(error === 'USER_EXISTS' ? 'accountExists' : error === 'RATE_LIMIT' ? 'rateLimit' : error === 'STORAGE_ERROR' ? 'storageError' : error === 'INVALID_INPUT' ? 'invalidInput' : 'authError')}</p>}
      <button className="action-button" disabled={busy} type="submit">{t(busy ? 'loading' : mode)}</button>
      <button type="button" className="text-link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{t(mode === 'login' ? 'register' : 'login')}</button>
    </form><PreferencesPanel />
  </div></main>
}
