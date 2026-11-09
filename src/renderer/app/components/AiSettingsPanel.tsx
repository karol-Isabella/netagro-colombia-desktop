import { useEffect, useState, type FormEvent } from 'react'
import { Brain, KeyRound, ShieldCheck, Trash2 } from 'lucide-react'
import { useTranslation } from '@renderer/i18n/useTranslation'

export function AiSettingsPanel() {
  const t = useTranslation()
  const [apiKey, setApiKey] = useState('')
  const [configured, setConfigured] = useState(false)
  const [secureStorageAvailable, setSecureStorageAvailable] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    void window.netAgro?.aiKeyStatus?.().then((response) => {
      if (!mounted || !response.ok) return
      setConfigured(response.data.configured)
      setSecureStorageAvailable(response.data.secureStorageAvailable)
      setStorageError(response.data.storageError)
    }).catch(() => undefined)
    return () => { mounted = false }
  }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const response = await window.netAgro?.saveAiKey({ apiKey })
      if (response?.ok) {
        setConfigured(true)
        setStorageError(false)
        setApiKey('')
        setMessage(t('aiKeySaved'))
      } else setMessage(t(response?.error === 'SECURE_STORAGE_UNAVAILABLE' ? 'aiSecureStorageUnavailable' : 'aiKeySaveError'))
    } catch { setMessage(t('aiKeySaveError')) }
    finally { setBusy(false) }
  }

  async function remove() {
    setBusy(true)
    setMessage('')
    try {
      const response = await window.netAgro?.removeAiKey()
      if (response?.ok) {
        setConfigured(false)
        setStorageError(false)
        setMessage(t('aiKeyRemoved'))
      } else setMessage(t('aiKeySaveError'))
    } catch { setMessage(t('aiKeySaveError')) }
    finally { setBusy(false) }
  }

  return (
    <section className="settings-card ai-settings-card">
      <div className="ai-settings-heading">
        <span className="ai-settings-icon"><Brain size={18} aria-hidden="true" /></span>
        <div><h2>{t('aiSettingsTitle')}</h2><p>{t('aiSettingsDescription')}</p></div>
      </div>
      {secureStorageAvailable ? (
        <div className={configured ? 'ai-key-status is-configured' : 'ai-key-status'}>
          {configured ? <ShieldCheck size={16} aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />}
          <span>{t(configured ? 'aiKeyConfigured' : 'aiKeyMissing')}</span>
        </div>
      ) : (
        <p className="ai-settings-message" role="status">{t('aiSecureStorageUnavailable')}</p>
      )}
      {storageError && <p className="ai-settings-message" role="status">{t('aiKeyStorageRecovery')}</p>}
      <form className="ai-key-form" onSubmit={(event) => void save(event)}>
        <label htmlFor="gemini-api-key">{t('aiKeyLabel')}</label>
        <div className="ai-key-controls">
          <input id="gemini-api-key" type="password" autoComplete="off" minLength={20} maxLength={512}
            value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={t(configured ? 'aiKeyReplaceHint' : 'aiKeyHint')}
            disabled={!secureStorageAvailable || busy} />
          <button type="submit" className="action-button" disabled={!secureStorageAvailable || busy || apiKey.trim().length < 20}>
            {t(busy ? 'loading' : 'aiSaveKey')}
          </button>
        </div>
      </form>
      {configured && <button type="button" className="ai-remove-key" onClick={() => void remove()} disabled={busy}><Trash2 size={14} />{t('aiRemoveKey')}</button>}
      <p className="small-copy ai-key-privacy">{t('aiKeyPrivacy')}</p>
      {message && <p className="ai-settings-message" role="status">{message}</p>}
    </section>
  )
}
