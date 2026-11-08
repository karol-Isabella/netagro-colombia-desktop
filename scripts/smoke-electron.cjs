const { app } = require('electron')
const assert = require('node:assert/strict')
const { mkdirSync, mkdtempSync, writeFileSync } = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const output = path.join(__dirname, '../test-results')
mkdirSync(output, { recursive: true })
app.setPath('userData', mkdtempSync(path.join(output, 'profile-')))
app.disableHardwareAcceleration()
const errors = []

app.on('browser-window-created', (_event, window) => {
  // Run the actual Main window without interrupting the user's desktop.
  window.show = () => {}
  const web = window.webContents
  web.setBackgroundThrottling(false)
  web.on('preload-error', (_event, _file, error) => errors.push(String(error)))
  web.on('console-message', (_event, level, message) => {
    if (level >= 3) errors.push(message)
  })
  web.once('did-finish-load', () => {
    void verify(window).catch((error) => { console.error(error); app.exit(1) })
  })
})

async function evaluate(web, body) {
  return web.executeJavaScript(`(async () => { ${body} })()`)
}

async function settle(web, predicate) {
  return evaluate(web, `
    const deadline = Date.now() + 8000;
    while (!(${predicate})) {
      if (Date.now() > deadline) throw new Error('UI condition timed out');
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    return true;
  `)
}

async function capture(web, filename) {
  // DOM state changes before Chromium submits a new frame, especially while hidden.
  await evaluate(web, 'await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));')
  writeFileSync(path.join(output, filename), (await web.capturePage()).toPNG())
}

async function verify(window) {
  const web = window.webContents
  const security = web.getLastWebPreferences()
  assert.equal(security.sandbox, true)
  assert.equal(security.contextIsolation, true)
  assert.equal(security.nodeIntegration, false)
  await settle(web, "document.querySelector('h1')?.textContent === 'Panorama'")
  const metadata = await evaluate(web, `
    if (typeof window.require !== 'undefined' || typeof window.ipcRenderer !== 'undefined') throw new Error('Privileged API leak');
    if (Object.keys(window.netAgro).join() !== 'getAppInfo') throw new Error('Unexpected bridge methods');
    return window.netAgro.getAppInfo();
  `)
  assert.equal(metadata.name, 'NetAgro Colombia')
  assert.equal(metadata.platform, process.platform)
  assert.equal(metadata.version, require('../package.json').version)
  const policy = await evaluate(web, `return document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;`)
  assert.ok(policy.includes("connect-src 'none'"))
  await capture(web, 'overview-light.png')

  await evaluate(web, `
    document.querySelector('input[value="dark"]').click();
    const language = document.querySelector('select');
    language.value = 'en';
    language.dispatchEvent(new Event('change', { bubbles: true }));
  `)
  await settle(web, "document.documentElement.lang === 'en' && document.documentElement.classList.contains('dark')")
  await capture(web, 'overview-dark-en.png')
  await evaluate(web, `document.querySelector('a[href="#/settings"]').click();`)
  await settle(web, "document.querySelector('.about-card')?.textContent.includes('Version')")
  const ready = new Promise(resolve => web.once('did-finish-load', resolve))
  web.reload()
  await ready
  await settle(web, "document.documentElement.lang === 'en' && document.querySelector('h1')?.textContent === 'Preferences'")
  assert.equal(await evaluate(web, `return document.documentElement.classList.contains('dark');`), true)
  window.setSize(820, 650)
  await settle(web, 'window.innerWidth <= 820')
  assert.equal(await evaluate(web, `return document.documentElement.scrollWidth <= window.innerWidth;`), true)
  await capture(web, 'settings-compact.png')
  assert.deepEqual(errors, [])
  const result = { passed: true, metadata, security: { sandbox: security.sandbox, contextIsolation: security.contextIsolation, nodeIntegration: security.nodeIntegration }, checks: ['production boot', 'real IPC', 'no raw Electron API', 'production CSP', 'theme and locale', 'persistence after reload', 'compact layout', 'no renderer or preload errors'] }
  writeFileSync(path.join(output, 'electron-smoke.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
  app.exit(0)
}

void import(pathToFileURL(path.join(__dirname, '../dist-electron/main.js')).href).catch((error) => {
  console.error(error)
  app.exit(1)
})
