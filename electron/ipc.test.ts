import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { registerAppIpc } from './ipc'

const mock = vi.hoisted(() => ({ handle: vi.fn() }))
vi.mock('electron', () => ({ ipcMain: { handle: mock.handle } }))

describe('Main IPC authorization', () => {
  const document = 'file:///C:/NetAgro/dist/index.html'
  const frame = { url: `${document}#/settings` }
  const webContents = { mainFrame: frame }
  const window = { webContents } as unknown as BrowserWindow
  const info = { name: 'NetAgro Colombia', version: '0.0.0', platform: 'win32' } as const
  let handler: (event: IpcMainInvokeEvent, request: unknown) => unknown
  beforeEach(() => {
    registerAppIpc(() => window, document, info)
    handler = mock.handle.mock.calls[0][1] as typeof handler
  })
  function event(sender: unknown = webContents, senderFrame: unknown = frame): IpcMainInvokeEvent {
    return { sender, senderFrame } as IpcMainInvokeEvent
  }
  it('returns validated metadata to the trusted main frame', () => {
    expect(mock.handle).toHaveBeenCalledWith('app:get-info', expect.any(Function))
    expect(handler(event(), undefined)).toEqual(info)
  })
  it('rejects payloads even from the trusted renderer', () => {
    expect(() => handler(event(), { path: '/etc/passwd' })).toThrow()
  })
  it('rejects other webContents and child frames', () => {
    expect(() => handler(event({ mainFrame: frame }), undefined)).toThrow('Untrusted')
    expect(() => handler(event(webContents, { url: frame.url }), undefined)).toThrow('Untrusted')
    expect(() => handler(event(webContents, null), undefined)).toThrow('Untrusted')
  })
  it('rejects a main frame that navigates to another document', () => {
    frame.url = 'https://attacker.example/'
    try { expect(() => handler(event(), undefined)).toThrow('Untrusted') }
    finally { frame.url = `${document}#/settings` }
  })
  it('rejects requests after the application window closes', () => {
    mock.handle.mockClear()
    registerAppIpc(() => null, document, info)
    const closedHandler = mock.handle.mock.calls[0][1] as typeof handler
    expect(() => closedHandler(event(), undefined)).toThrow('Untrusted')
  })
})
