// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { preferencesStore } from './preferences/usePreferences'
import { defaults, preferencesKey } from './preferences/store'

beforeEach(() => {
  window.location.hash = '#/'
  localStorage.clear()
  preferencesStore.setState({ ...defaults, persistenceFailed: false })
  Object.defineProperty(window, 'netAgro', { configurable: true, value: undefined })
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('navigates, translates the shell and persists user preferences', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'Panorama' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Los datos aún no están disponibles' })).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Preferencias' }))
  await user.click(screen.getByRole('radio', { name: 'Oscuro' }))
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en')
  expect(screen.getByRole('heading', { level: 1, name: 'Preferences' })).toBeTruthy()
  expect(document.documentElement.lang).toBe('en')
  expect(JSON.parse(localStorage.getItem(preferencesKey) ?? '{}')).toEqual({ version: 1, preferences: { theme: 'dark', locale: 'en' } })
  await user.click(screen.getByRole('link', { name: 'Overview' }))
  expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Explore map' }))
  expect(screen.getByRole('heading', { level: 1, name: 'Explore map' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Explore map' }).getAttribute('aria-current')).toBe('page')
  await user.click(screen.getByRole('link', { name: 'Preferences' }))
  expect(await screen.findByText('Browser preview')).toBeTruthy()
  expect(screen.getAllByRole('radio', { name: 'Dark' }).every((input) => (input as HTMLInputElement).checked)).toBe(true)
})

it('shows real app metadata from the desktop capability', async () => {
  window.location.hash = '#/settings'
  Object.defineProperty(window, 'netAgro', { value: {
    getAppInfo: vi.fn().mockResolvedValue({ name: 'NetAgro Colombia', version: '0.0.0', platform: 'win32' }),
  } })
  render(<App />)
  expect(await screen.findByText('NetAgro Colombia · Versión 0.0.0')).toBeTruthy()
})

it('shows an honest unavailable status if the bridge fails', async () => {
  window.location.hash = '#/settings'
  Object.defineProperty(window, 'netAgro', { value: { getAppInfo: vi.fn().mockRejectedValue(new Error('IPC unavailable')) } })
  render(<App />)
  expect(await screen.findByText('Información de escritorio no disponible')).toBeTruthy()
})

it('recovers from an unknown route', async () => {
  window.location.hash = '#/missing'
  const user = userEvent.setup()
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Volver al panorama' }))
  await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Panorama' })).toBeTruthy())
})
