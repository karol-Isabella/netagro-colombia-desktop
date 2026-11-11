import { app, BrowserWindow, session, dialog, safeStorage } from 'electron'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { registerAppIpc } from '@main/ipc'
import { registerDataIpc, createRouteRegistrar } from '@main/dataIpc'
import { contracts } from '@shared/contracts'
import { AnalysisService } from '@main/services/analysis'
import { AuthService } from '@main/services/auth'
import { rankingCsv, centersCsv } from '@main/services/export'
import { CoverageRepository } from '@main/services/repository'
import { AiKeyStore } from '@main/services/aiKeyStore'
import { contentSecurityPolicy, isTrustedDocument } from '@main/security'

const directory = path.dirname(fileURLToPath(import.meta.url))
const rendererPath = path.join(directory, '../dist/index.html')
const devUrl = !app.isPackaged ? process.env['VITE_DEV_SERVER_URL'] : undefined
const trustedDocument = devUrl ?? pathToFileURL(rendererPath).href
const smokeTest = app.commandLine.hasSwitch('smoke-test')
if (smokeTest) {
  const profile = app.commandLine.getSwitchValue('user-data-dir')
  if (!path.isAbsolute(profile)) throw new Error('Smoke tests require an absolute isolated profile')
  app.setPath('userData', profile)
  app.disableHardwareAcceleration()
}
app.setAppUserModelId('co.netagro.colombia')
let window: BrowserWindow | null = null

function createWindow() {
  window = new BrowserWindow({
    title: 'NetAgro Colombia',
    icon: app.isPackaged ? path.join(process.resourcesPath, 'icon.ico') : path.join(directory, '../build/icon.ico'),
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
  currentWindow.once('ready-to-show', () => { if (!smokeTest) currentWindow.show() })
  if (smokeTest) currentWindow.webContents.setBackgroundThrottling(false)
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

void app.whenReady().then(async () => {
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
  const repository = new CoverageRepository(
    app.isPackaged ? path.join(process.resourcesPath, 'data') : path.join(directory, '../data/processed'),
  )
  const auth = new AuthService(app.getPath('userData'))
  const aiKeys = new AiKeyStore(app.getPath('userData'), safeStorage, process.platform)
  await aiKeys.initialize()
  registerDataIpc(() => window, trustedDocument, repository, () => auth.requireSession())
  const route = createRouteRegistrar(() => window, trustedDocument, () => auth.requireSession())
  route('auth:status', contracts['auth:status'], () => auth.status(), false)
  route('auth:register', contracts['auth:register'], input => auth.register(input), false)
  route('auth:login', contracts['auth:login'], input => auth.login(input), false)
  route('auth:logout', contracts['auth:logout'], () => { auth.logout(); return null }, false)
  route('ai:key-status', contracts['ai:key-status'], () => aiKeys.status())
  route('ai:key-save', contracts['ai:key-save'], async input => { await aiKeys.save(input.apiKey); return null })
  route('ai:key-remove', contracts['ai:key-remove'], async () => { await aiKeys.clear(); return null })
  route('export:csv', contracts['export:csv'], async input => {
    if (!window) throw new Error('EXPORT_FAILED')
    const { data } = await repository.load()
    const csv = input.kind === 'rankings' ? rankingCsv(data,input.territoryId,input.layer) : centersCsv(data,input.territoryId,input.layer)
    const destination = await dialog.showSaveDialog(window, {
      defaultPath: `NetAgro-${input.kind}-${input.territoryId}-${data.metadata.period}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    })
    if (destination.canceled || !destination.filePath) return { saved: false }
    auth.requireSession()
    try { await writeFile(destination.filePath, csv, 'utf8') } catch { throw new Error('EXPORT_FAILED') }
    return { saved: true }
  })
  const analysis = new AnalysisService(repository, () => aiKeys.getKey())
  let analyzing = false
  route('analysis:run', contracts['analysis:run'], async input => {
    if (analyzing) throw new Error('RATE_LIMIT')
    analyzing = true
    try { return await analysis.analyze(input) } finally { analyzing = false }
  })
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
