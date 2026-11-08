import { ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import { contracts, errorCodeSchema, type ApiResult } from '@shared/contracts'
import { isTrustedDocument } from './security'
import type { CoverageRepository } from './services/repository'

export function createRouteRegistrar(getWindow: () => BrowserWindow | null, trusted: string, authorize: () => void = () => {}) {
  return function route<Q, R>(channel: string, spec: { request: z.ZodType<Q>; response: z.ZodType<ApiResult<R>> },
    callback: (request: Q) => Promise<R> | R, requiresSession = true) {
    ipcMain.handle(channel, async (event: IpcMainInvokeEvent, request: unknown) => {
      try {
        const window = getWindow()
        if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame ||
          !isTrustedDocument(event.senderFrame.url, trusted)) return { ok: false, error: 'AUTH_REQUIRED' }
        if (requiresSession) authorize()
        const input = spec.request.parse(request)
        return spec.response.parse({ ok: true, data: await callback(input) })
      } catch (error) {
        if (error instanceof z.ZodError) return { ok: false, error: 'INVALID_INPUT' }
        const known = errorCodeSchema.safeParse(error instanceof Error ? error.message : '')
        return { ok: false, error: known.success ? known.data : 'INTERNAL' }
      }
    })
  }
}
export function registerDataIpc(getWindow: () => BrowserWindow | null, trusted: string, repository: CoverageRepository) {
  const route = createRouteRegistrar(getWindow, trusted)
  route('data:load', contracts['data:load'], async () => (await repository.load()).data)
  route('data:maps', contracts['data:maps'], async () => (await repository.load()).maps)
}
