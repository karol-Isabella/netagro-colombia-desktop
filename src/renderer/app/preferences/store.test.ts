import { describe, expect, it, vi } from 'vitest'
import { createPreferencesStore, defaults, preferencesKey, readPreferences } from './store'

function memoryStorage(value: string | null = null) {
  const data = new Map<string, string>()
  if (value !== null) data.set(preferencesKey, value)
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, next: string) => { data.set(key, next) } }
}

describe('preferences persistence', () => {
  it('persists and restores theme and language together', () => {
    const storage = memoryStorage()
    const store = createPreferencesStore(storage)
    store.getState().update({ theme: 'dark' })
    store.getState().update({ locale: 'en' })
    expect(readPreferences(storage)).toEqual({ theme: 'dark', locale: 'en' })
    expect(createPreferencesStore(storage).getState()).toMatchObject({ theme: 'dark', locale: 'en' })
  })
  it.each(['broken JSON', 'null', '{"version":2}', '{"version":1,"preferences":{"theme":"dark","locale":"xx"}}'])('recovers from invalid stored data: %s', (raw) => {
    expect(readPreferences(memoryStorage(raw))).toEqual(defaults)
  })
  it('continues in memory when storage access is denied', () => {
    const denied = { getItem: () => { throw new Error('Denied') }, setItem: () => { throw new Error('Quota') } }
    const store = createPreferencesStore(denied)
    expect(store.getState()).toMatchObject(defaults)
    store.getState().update({ theme: 'dark' })
    expect(store.getState()).toMatchObject({ theme: 'dark', persistenceFailed: true })
  })
  it('reports unavailable storage and clears write errors after recovery', () => {
    expect(createPreferencesStore().getState().persistenceFailed).toBe(true)
    const storage = memoryStorage()
    const set = vi.spyOn(storage, 'setItem').mockImplementationOnce(() => { throw new Error('Quota') })
    const store = createPreferencesStore(storage)
    store.getState().update({ theme: 'light' })
    expect(store.getState().persistenceFailed).toBe(true)
    store.getState().update({ locale: 'en' })
    expect(store.getState().persistenceFailed).toBe(false)
    expect(set).toHaveBeenCalledTimes(2)
  })
})
