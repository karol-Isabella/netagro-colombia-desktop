import { ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { contracts, type AppInfo } from '@shared/contracts'
import { isTrustedDocument } from '@main/security'

export function registerAppIpc(getWindow: () => BrowserWindow | null, trustedDocument: string, info: AppInfo) {
  ipcMain.handle('app:get-info', (event: IpcMainInvokeEvent, request: unknown) => {
    const window = getWindow()
    if (!window || event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      !isTrustedDocument(event.senderFrame.url, trustedDocument)) {
      throw new Error('Untrusted IPC sender')
    }
    contracts['app:get-info'].request.parse(request)
    return contracts['app:get-info'].response.parse(info)
  })
}
