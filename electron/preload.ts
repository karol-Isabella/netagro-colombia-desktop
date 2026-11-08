import { contextBridge, ipcRenderer } from 'electron'
import { contracts, type DesktopApi } from '@shared/contracts'

const api: DesktopApi = Object.freeze({
  async getAppInfo() {
    const contract = contracts['app:get-info']
    const result: unknown = await ipcRenderer.invoke('app:get-info', contract.request.parse(undefined))
    return contract.response.parse(result)
  },
})

contextBridge.exposeInMainWorld('netAgro', api)
