import { contextBridge, ipcRenderer } from 'electron'
import { contracts, type DesktopApi } from '@shared/contracts'
import type { z } from 'zod'

type Channel = keyof typeof contracts
async function invoke<C extends Channel>(channel: C, request: z.infer<typeof contracts[C]['request']>): Promise<z.infer<typeof contracts[C]['response']>> {
  const contract = contracts[channel]
  const response: unknown = await ipcRenderer.invoke(channel, contract.request.parse(request))
  return contract.response.parse(response) as z.infer<typeof contracts[C]['response']>
}

const api: DesktopApi = Object.freeze({
  async getAppInfo() {
    const contract = contracts['app:get-info']
    const result: unknown = await ipcRenderer.invoke('app:get-info', contract.request.parse(undefined))
    return contract.response.parse(result)
  },
  getCoverage: () => invoke('data:load', undefined),
  getMaps: () => invoke('data:maps', undefined),
  analyze: (input: z.infer<typeof contracts['analysis:run']['request']>) => invoke('analysis:run', input),
})

contextBridge.exposeInMainWorld('netAgro', api)
