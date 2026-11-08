import { beforeEach, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { createRouteRegistrar } from './dataIpc'
import { resultSchema } from '@shared/contracts'
const mock = vi.hoisted(() => ({ handle: vi.fn() }))
vi.mock('electron', () => ({ ipcMain: { handle: mock.handle } }))
const frame = { url: 'file:///app/index.html' }, webContents = { mainFrame: frame }
const window = { webContents } as unknown as BrowserWindow
const event = { sender: webContents, senderFrame: frame } as unknown as IpcMainInvokeEvent
const spec = { request: z.undefined(), response: resultSchema(z.null()) }
beforeEach(() => { mock.handle.mockClear() })
it('denies unauthenticated calls before touching data', async () => {
  const callback = vi.fn()
  createRouteRegistrar(() => window, frame.url, () => { throw new Error('AUTH_REQUIRED') })('test', spec, callback)
  const handler = mock.handle.mock.calls[0][1] as (event: IpcMainInvokeEvent, value: unknown) => Promise<unknown>
  expect(await handler(event, undefined)).toEqual({ ok: false, error: 'AUTH_REQUIRED' })
  expect(callback).not.toHaveBeenCalled()
})
it('rechecks authentication after async work and sanitizes unexpected errors', async () => {
  let authenticated = true
  const guard = () => { if (!authenticated) throw new Error('AUTH_REQUIRED') }
  createRouteRegistrar(() => window, frame.url, guard)('test', spec, async () => { authenticated = false; return null })
  const handler = mock.handle.mock.calls[0][1] as (event: IpcMainInvokeEvent, value: unknown) => Promise<unknown>
  expect(await handler(event, undefined)).toEqual({ ok: false, error: 'AUTH_REQUIRED' })
  mock.handle.mockClear()
  createRouteRegistrar(() => window, frame.url, () => {})('error', spec, () => { throw new Error('private path and secret') })
  const failed = mock.handle.mock.calls[0][1] as typeof handler
  expect(await failed(event, undefined)).toEqual({ ok: false, error: 'INTERNAL' })
})
