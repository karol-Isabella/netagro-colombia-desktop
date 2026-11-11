const { app, dialog } = require('electron')
const assert = require('node:assert/strict')
const { mkdirSync, mkdtempSync, writeFileSync, readFileSync } = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const output = path.join(__dirname, '../test-results')
mkdirSync(output, { recursive: true })
app.setPath('userData', mkdtempSync(path.join(output, 'profile-')))
app.disableHardwareAcceleration()
const errors = []
const exported = []
dialog.showSaveDialog = async (_window, options) => {
  const filePath = path.join(output, path.basename(options.defaultPath))
  exported.push(filePath)
  return { canceled: false, filePath }
}

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
    const deadline = Date.now() + 20000;
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
  const expected = await evaluate(web, "return getComputedStyle(document.querySelector('.sidebar')).backgroundColor.match(/\\d+/g).slice(0, 3).map(Number);")
  for (let attempt = 0; attempt < 20; attempt++) {
    const image = await web.capturePage()
    const pixel = image.toBitmap()
    if (pixel[2] === expected[0] && pixel[1] === expected[1] && pixel[0] === expected[2]) {
      writeFileSync(path.join(output, filename), image.toPNG())
      return
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Captured theme does not match the rendered CSS: ${filename}`)
}

async function verify(window) {
  const web = window.webContents
  const security = web.getLastWebPreferences()
  assert.equal(security.sandbox, true)
  assert.equal(security.contextIsolation, true)
  assert.equal(security.nodeIntegration, false)
  await settle(web, "document.querySelector('.landing-page') !== null")
  await evaluate(web, "document.querySelector('.landing-login-link').click();")
  await settle(web, "document.querySelector('.auth-form') !== null")
  const denied = await evaluate(web, 'return window.netAgro.getCoverage();')
  assert.deepEqual(denied, { ok: false, error: 'AUTH_REQUIRED' })
  await evaluate(web, `
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [id,value] of [['username','smoke-user'],['password','only-a-test-password']]) {
      const input = document.getElementById(id); setter.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true}));
    }
  `)
  await evaluate(web, "document.querySelector('.auth-form').requestSubmit();")
  await settle(web, "document.querySelector('h1')?.textContent === 'Panorama'")
  const metadata = await evaluate(web, `
    if (typeof window.require !== 'undefined' || typeof window.ipcRenderer !== 'undefined') throw new Error('Privileged API leak');
    if (Object.keys(window.netAgro).some(key => ['send','invoke','on','off'].includes(key))) throw new Error('Unexpected bridge methods');
    return window.netAgro.getAppInfo();
  `)
  assert.equal(metadata.name, 'NetAgro Colombia')
  assert.equal(metadata.platform, process.platform)
  assert.equal(metadata.version, require('../package.json').version)
  const policy = await evaluate(web, `return document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;`)
  assert.ok(policy.includes("connect-src 'none'"))
  await settle(web, "document.querySelector('.stats-grid') !== null")
  await capture(web, 'dashboard.png')
  await evaluate(web, "document.querySelector('a[href=\"#/map\"]').click();")
  await settle(web, "document.querySelector('.coverage-map')?.dataset.rendered === 'true'")
  await evaluate(web, "document.querySelector('.map-toolbar .action-button').click();")
  await settle(web, "document.querySelector('.territory-panel h2')?.textContent === 'NARIÑO' && document.querySelector('.coverage-map')?.dataset.rendered === 'true'")
  await evaluate(web, "document.querySelector('.map-options input').click(); [...document.querySelectorAll('.layer-picker button')].find(b => b.textContent === 'Sin cobertura').click();")
  await settle(web, "document.querySelector('.coverage-map')?.dataset.rendered === 'true'")
  await capture(web, 'narino-uncovered.png')
  await evaluate(web, "document.querySelector('.analysis-panel .action-button').click();")
  await settle(web, "document.querySelector('.analysis-result')?.textContent.includes('Reglas locales')")
  await capture(web, 'overview-light.png')

  await evaluate(web, `
    document.querySelector('input[value="dark"]').click();
    const language = document.querySelector('.preferences-panel select');
    language.value = 'en';
    language.dispatchEvent(new Event('change', { bubbles: true }));
  `)
  await settle(web, "document.documentElement.lang === 'en' && document.documentElement.classList.contains('dark')")
  await capture(web, 'overview-dark-en.png')
  await evaluate(web, "document.querySelector('a[href=\"#/reports\"]').click();")
  await settle(web, "document.querySelector('tbody tr') !== null")
  assert.equal(await evaluate(web, 'return document.querySelectorAll("tbody tr").length;'), 50)
  const csvResult = await evaluate(web, "return window.netAgro.exportCsv({territoryId:'52',layer:'4G',kind:'rankings'});")
  assert.deepEqual(csvResult,{ok:true,data:{saved:true}})
  assert.ok(readFileSync(exported[0],'utf8').includes('PASTO'))
  assert.ok(!readFileSync(exported[0],'utf8').includes('MEDELLÍN'))
  const centersResult = await evaluate(web, "return window.netAgro.exportCsv({territoryId:'52',layer:'none',kind:'centers'});")
  assert.deepEqual(centersResult,{ok:true,data:{saved:true}})
  assert.equal(readFileSync(exported[1],'utf8').trim().split('\n').length,567)
  await capture(web, 'rankings.png')
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
  await evaluate(web, "document.querySelector('.account-note button').click();")
  await settle(web, "document.querySelector('.auth-form') !== null")
  assert.deepEqual(await evaluate(web, 'return window.netAgro.getCoverage();'),{ok:false,error:'AUTH_REQUIRED'})
  assert.deepEqual(errors, [])
  const result = { passed: true, metadata, security: { sandbox: security.sandbox, contextIsolation: security.contextIsolation, nodeIntegration: security.nodeIntegration }, checks: ['production boot', 'registration through UI', 'session-gated IPC', 'offline map and heatmap', 'Narino selection', 'local diagnosis', 'rankings', 'real CSV export in selected scope', 'production CSP', 'theme and locale', 'persistence after reload', 'compact layout', 'logout blocks data', 'no renderer or preload errors'] }
  writeFileSync(path.join(output, 'electron-smoke.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
  app.exit(0)
}

void import(pathToFileURL(path.join(__dirname, '../dist-electron/main.js')).href).catch((error) => {
  console.error(error)
  app.exit(1)
})
