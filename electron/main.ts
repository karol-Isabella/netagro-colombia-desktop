import { app, BrowserWindow, session } from 'electron'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { registerAppIpc } from '@main/ipc'
import { contentSecurityPolicy, isTrustedDocument } from '@main/security'

const directory = path.dirname(fileURLToPath(import.meta.url))
const rendererPath = path.join(directory, '../dist/index.html')
const devUrl = !app.isPackaged ? process.env['VITE_DEV_SERVER_URL'] : undefined
const trustedDocument = devUrl ?? pathToFileURL(rendererPath).href
let window: BrowserWindow | null = null

function createWindow() {
  window = new BrowserWindow({
    title: 'NetAgro Colombia',
    width: 1440,
    height: 940,
    minWidth: 820,
    minHeight: 600,
    show: false,
    backgroundColor: '#f5f6f8',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(directory, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
    },
  })
  const currentWindow = window
  currentWindow.once('ready-to-show', () => currentWindow.show())
  currentWindow.on('closed', () => { if (window === currentWindow) window = null })
  currentWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  currentWindow.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedDocument(url, trustedDocument)) event.preventDefault()
  })
  currentWindow.webContents.on('will-attach-webview', (event) => event.preventDefault())
  const loading = devUrl ? currentWindow.loadURL(devUrl) : currentWindow.loadFile(rendererPath)
  void loading.catch((error: unknown) => {
    console.error('Unable to load NetAgro', error)
    app.quit()
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

void app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  session.defaultSession.setPermissionCheckHandler(() => false)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [contentSecurityPolicy(Boolean(devUrl))],
    } })
  })
  registerAppIpc(() => window, trustedDocument, {
    name: 'NetAgro Colombia', version: app.getVersion(), platform: process.platform,
  })
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
