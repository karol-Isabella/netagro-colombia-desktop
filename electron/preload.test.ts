import { expect, it, vi } from 'vitest'
import type { DesktopApi } from '@shared/contracts'

const bridge = vi.hoisted(() => ({ expose: vi.fn(), invoke: vi.fn() }))
vi.mock('electron', () => ({ contextBridge: { exposeInMainWorld: bridge.expose }, ipcRenderer: { invoke: bridge.invoke } }))

it('exposes only the named capability and validates responses', async () => {
  await import('./preload')
  const [name, api] = bridge.expose.mock.calls[0] as [string, DesktopApi]
  expect(name).toBe('netAgro')
  expect(Object.keys(api)).toEqual(['getAppInfo'])
  bridge.invoke.mockResolvedValue({ name: 'NetAgro Colombia', version: '0.0.0', platform: 'win32' })
  await expect(api.getAppInfo()).resolves.toHaveProperty('name', 'NetAgro Colombia')
  expect(bridge.invoke).toHaveBeenCalledWith('app:get-info', undefined)
  bridge.invoke.mockResolvedValue({ version: 'bad response' })
  await expect(api.getAppInfo()).rejects.toThrow()
})
