// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { bindAppearance } from './appearance'
import { createPreferencesStore } from './store'

it('follows system changes only in system mode and removes subscriptions', () => {
  const media = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  const store = createPreferencesStore()
  const root = document.documentElement
  const dispose = bindAppearance(store.getState, store.subscribe, media as unknown as MediaQueryList, root)
  expect(root.classList.contains('dark')).toBe(true)
  const onChange = media.addEventListener.mock.calls[0][1] as () => void
  media.matches = false
  onChange()
  expect(root.classList.contains('dark')).toBe(false)
  store.getState().update({ theme: 'dark', locale: 'en' })
  onChange()
  expect(root.classList.contains('dark')).toBe(true)
  expect(root.lang).toBe('en')
  expect(root.style.colorScheme).toBe('dark')
  store.getState().update({ theme: 'light' })
  media.matches = true
  onChange()
  expect(root.classList.contains('dark')).toBe(false)
  dispose()
  expect(media.removeEventListener).toHaveBeenCalledWith('change', onChange)
  store.getState().update({ theme: 'dark' })
  expect(root.classList.contains('dark')).toBe(false)
})
