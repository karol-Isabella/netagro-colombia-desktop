import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Sprout, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@renderer/services/authStore'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { usePreferences } from '@renderer/preferences/usePreferences'

export function AuthGate({ children }: { children: ReactNode }) {
  const { status, initialize } = useAuthStore()
  const t = useTranslation()

  useEffect(() => {
    void initialize()
  }, [initialize])

  if (status === 'loading') {
    return (
      <div className="min-h-screen grid place-items-center bg-[var(--canvas)]">
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]" role="status">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    )
  }

  if (status === 'preview' || status === 'authenticated') {
    return <>{children}</>
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-[var(--canvas)]">
        <div className="auth-card max-w-md p-8 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <p role="alert" className="text-sm font-medium text-[var(--text)]">
            {t('storageError')}
          </p>
          <button className="action-button" onClick={() => void initialize()}>
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  return <AuthForm />
}

function AuthForm() {
  const { hasAccounts, busy, error, submit } = useAuthStore()
  const { locale } = usePreferences()
  const t = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>(hasAccounts ? 'login' : 'register')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ username: false, password: false })
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  // Localized validation error messages
  const isEs = locale === 'es'
  let usernameError = ''
  if (touched.username || attemptedSubmit) {
    if (!username.trim()) {
      usernameError = isEs ? 'El usuario es obligatorio' : 'Username is required'
    } else if (username.length < 3) {
      usernameError = isEs ? 'Mínimo 3 caracteres requeridos' : 'Minimum 3 characters required'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      usernameError = isEs ? 'Solo letras, números, puntos y guiones' : 'Only letters, numbers, dots, and hyphens'
    }
  }

  let passwordError = ''
  if (touched.password || attemptedSubmit) {
    if (!password) {
      passwordError = isEs ? 'La contraseña es obligatoria' : 'Password is required'
    } else if (password.length < 10) {
      passwordError = isEs ? 'Mínimo 10 caracteres requeridos' : 'Minimum 10 characters required'
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    setAttemptedSubmit(true)

    // Manual validation check before sending
    const validUser = username.trim().length >= 3 && /^[a-zA-Z0-9._-]+$/.test(username)
    const validPass = password.length >= 10

    if (!validUser || !validPass) {
      return
    }

    await submit(mode, username, password)
    setPassword('')
    setAttemptedSubmit(false)
  }

  function toggleMode() {
    setMode(mode === 'login' ? 'register' : 'login')
    setTouched({ username: false, password: false })
    setAttemptedSubmit(false)
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* Modern App Header */}
        <div className="brand-icon">
          <Sprout size={28} aria-hidden="true" />
        </div>
        <h1>{t('product')}</h1>
        <p>{t('authDescription')}</p>

        {/* Custom Form with Native Validation Disabled */}
        <form className="auth-form" noValidate onSubmit={(event) => void send(event)}>
          <h2>{t(mode)}</h2>

          {/* Username Field with Custom Error Display */}
          <div>
            <label htmlFor="username" className="flex items-center justify-between">
              <span>{t('username')}</span>
              <span className="text-[10px] text-[var(--muted)] font-normal">min. 3</span>
            </label>
            <div className="relative">
              <input
                id="username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={40}
                pattern="[a-zA-Z0-9._\-]+"
                value={username}
                className={usernameError ? 'input-error' : ''}
                onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {usernameError && (
              <div className="field-error-message" role="alert">
                <AlertCircle size={13} aria-hidden="true" className="shrink-0" />
                <span>{usernameError}</span>
              </div>
            )}
          </div>

          {/* Password Field with Custom Error Display */}
          <div>
            <label htmlFor="password" className="flex items-center justify-between">
              <span>{t('password')}</span>
              <span className="text-[10px] text-[var(--muted)] font-normal">min. 10</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                minLength={10}
                maxLength={128}
                aria-describedby="password-hint"
                value={password}
                className={passwordError ? 'input-error' : ''}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {passwordError ? (
              <div className="field-error-message" role="alert">
                <AlertCircle size={13} aria-hidden="true" className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            ) : (
              <p id="password-hint" className="small-copy">
                {t('passwordHint')}
              </p>
            )}
          </div>

          {/* Server / Backend Error Alert Banner */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={16} aria-hidden="true" className="shrink-0 mt-0.5" />
              <span>
                {t(
                  error === 'USER_EXISTS'
                    ? 'accountExists'
                    : error === 'RATE_LIMIT'
                      ? 'rateLimit'
                      : error === 'STORAGE_ERROR'
                        ? 'storageError'
                        : error === 'INVALID_INPUT'
                          ? 'invalidInput'
                          : 'authError'
                )}
              </span>
            </div>
          )}

          {/* Main Action Button */}
          <button className="action-button" disabled={busy} type="submit">
            <span>{t(busy ? 'loading' : mode)}</span>
            {!busy && <ArrowRight size={16} aria-hidden="true" />}
          </button>

          {/* Mode Switcher */}
          <button type="button" className="text-link" onClick={toggleMode}>
            {t(mode === 'login' ? 'register' : 'login')}
          </button>
        </form>
      </div>
    </main>
  )
}
