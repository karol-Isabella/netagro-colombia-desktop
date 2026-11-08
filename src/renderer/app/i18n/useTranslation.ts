import { usePreferences } from '@renderer/preferences/usePreferences'
import { messages, type MessageKey } from './messages'

export function useTranslation() {
  const { locale } = usePreferences()
  return (key: MessageKey): string => messages[locale][key]
}
