// Runs the production bundles with real Electron, without a dev server or user data.
const { spawn } = require('node:child_process')
const path = require('node:path')
const { mkdirSync, mkdtempSync, writeFileSync } = require('node:fs')
const manifest = require('../package.json')
const results = path.join(__dirname, '../test-results')
mkdirSync(results, { recursive: true })
const fixture = mkdtempSync(path.join(results, 'app-'))
writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({
  name: manifest.name,
  version: manifest.version,
  main: path.relative(fixture, path.join(__dirname, 'smoke-electron.cjs')),
}))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
delete env.VITE_DEV_SERVER_URL
const child = spawn(require('electron'), [fixture], {
  cwd: path.join(__dirname, '..'), env, windowsHide: true, stdio: 'inherit',
})
const timeout = setTimeout(() => { child.kill(); process.exitCode = 1 }, 90000)
child.on('error', (error) => { console.error(error); clearTimeout(timeout); process.exitCode = 1 })
child.on('exit', (code) => { clearTimeout(timeout); process.exitCode = code ?? 1 })
