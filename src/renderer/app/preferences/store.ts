import { createStore } from 'zustand/vanilla'
import { z } from 'zod'
import { preferencesSchema, type Preferences } from '@shared/contracts'

export const preferencesKey = 'netagro.preferences.v1'
export const defaults: Preferences = { theme: 'system', locale: 'es' }
const savedSchema = z.object({ version: z.literal(1), preferences: preferencesSchema }).strict()

export interface PreferenceStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function readPreferences(storage?: PreferenceStorage): Preferences {
  try {
    const raw = storage?.getItem(preferencesKey)
    if (!raw) return { ...defaults }
    const result = savedSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data.preferences : { ...defaults }
  } catch {
    return { ...defaults }
  }
}

export function createPreferencesStore(storage?: PreferenceStorage) {
  return createStore<Preferences & {
    persistenceFailed: boolean
    update: (patch: Partial<Preferences>) => void
  }>((set, get) => ({
    ...readPreferences(storage),
    persistenceFailed: !storage,
    update(patch) {
      const current = get()
      const next = preferencesSchema.parse({ theme: current.theme, locale: current.locale, ...patch })
      let persistenceFailed = false
      try {
        if (!storage) throw new Error('Storage unavailable')
        storage.setItem(preferencesKey, JSON.stringify({ version: 1, preferences: next }))
      } catch {
        persistenceFailed = true
      }
      set({ ...next, persistenceFailed })
    },
  }))
}
