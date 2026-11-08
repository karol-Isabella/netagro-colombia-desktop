import { useStore } from 'zustand'
import { createPreferencesStore, type PreferenceStorage } from './store'

function browserStorage(): PreferenceStorage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export const preferencesStore = createPreferencesStore(browserStorage())
export function usePreferences() {
  return useStore(preferencesStore)
}
