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

  const isEs = locale === 'es'

  // Validation rules:
  // Usuario: letras y números (y caracteres permitidos). Máximo 20 caracteres (sin mínimo restrictivo tosco).
  let usernameError = ''
  if (touched.username || attemptedSubmit) {
    if (!username.trim()) {
      usernameError = isEs ? 'El nombre de usuario es obligatorio' : 'Username is required'
    } else if (username.length > 20) {
      usernameError = isEs ? 'Máximo 20 caracteres permitidos' : 'Maximum 20 characters allowed'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      usernameError = isEs ? 'Solo se permiten letras y números' : 'Only letters and numbers are allowed'
    }
  }

  // Contraseña: Mínimo 6 caracteres y Máximo 20 caracteres.
  let passwordError = ''
  if (touched.password || attemptedSubmit) {
    if (!password) {
      passwordError = isEs ? 'La contraseña es obligatoria' : 'Password is required'
    } else if (password.length < 6) {
      passwordError = isEs ? 'Mínimo 6 caracteres requeridos' : 'Minimum 6 characters required'
    } else if (password.length > 20) {
      passwordError = isEs ? 'Máximo 20 caracteres permitidos' : 'Maximum 20 characters allowed'
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    setAttemptedSubmit(true)

    const validUser = username.trim().length >= 1 && username.length <= 20 && /^[a-zA-Z0-9._-]+$/.test(username)
    const validPass = password.length >= 6 && password.length <= 20

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
      {/* Ambient Aurora Animated Lights */}
      <div className="aurora-container" aria-hidden="true">
        <div className="aurora-orb-1" />
        <div className="aurora-orb-2" />
        <div className="aurora-orb-3" />
      </div>

      {/* Centered Glassmorphic Card */}
      <div className="auth-card">
        {/* Brand Icon */}
        <div className="brand-icon">
          <Sprout size={28} aria-hidden="true" />
        </div>

        {/* Clean, Elegant Header */}
        <h1>
          {mode === 'login'
            ? (isEs ? 'Iniciar sesión en NetAgro' : 'Sign in to NetAgro')
            : (isEs ? 'Crear cuenta en NetAgro' : 'Create NetAgro account')}
        </h1>
        <p>
          {isEs
            ? 'Plataforma oficial de conectividad y cobertura agropecuaria'
            : 'Official mobile coverage and connectivity analytics'}
        </p>

        {/* Modern Form with Native Validation Disabled */}
        <form className="auth-form" noValidate onSubmit={(event) => void send(event)}>
          {/* Campo Usuario con Etiqueta ARRIBA y Guía Sutil */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-[var(--text)] m-0">
                {isEs ? 'Nombre de usuario' : 'Username'}
              </label>
              <span className="text-[11px] text-[var(--muted)] font-normal">
                {isEs ? 'Hasta 20 caracteres' : 'Up to 20 characters'}
              </span>
            </div>
            <input
              id="username"
              autoComplete="username"
              required
              maxLength={20}
              pattern="[a-zA-Z0-9._\-]+"
              placeholder={isEs ? 'Ej. usuario2026' : 'e.g. user2026'}
              value={username}
              className={usernameError ? 'input-error' : ''}
              onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
              onChange={(e) => setUsername(e.target.value)}
            />
            {usernameError && (
              <div className="field-error-message" role="alert">
                <AlertCircle size={13} aria-hidden="true" className="shrink-0" />
                <span>{usernameError}</span>
              </div>
            )}
          </div>

          {/* Campo Contraseña con Etiqueta ARRIBA y Guía Sutil */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-[var(--text)] m-0">
                {isEs ? 'Contraseña' : 'Password'}
              </label>
              <span className="text-[11px] text-[var(--muted)] font-normal">
                {isEs ? '6-20 caracteres (letras y números)' : '6-20 characters (letters & numbers)'}
              </span>
            </div>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              maxLength={20}
              placeholder="••••••••"
              value={password}
              className={passwordError ? 'input-error' : ''}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordError && (
              <div className="field-error-message" role="alert">
                <AlertCircle size={13} aria-hidden="true" className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
          </div>

          {/* Banner de error devuelto por el servidor/IPC */}
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

          {/* Botón de acción principal */}
          <button className="action-button" disabled={busy} type="submit">
            <span>{t(busy ? 'loading' : mode)}</span>
            {!busy && <ArrowRight size={16} aria-hidden="true" />}
          </button>

          {/* Alternar modo */}
          <button type="button" className="text-link" onClick={toggleMode}>
            {t(mode === 'login' ? 'register' : 'login')}
          </button>
        </form>
      </div>
    </main>
  )
}
