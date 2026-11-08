const { readFileSync } = require('node:fs')
const { createHash } = require('node:crypto')
const path = require('node:path')
const directory = path.resolve(__dirname, '../data/processed')
const expected = ['coverage.json','departments.geojson','municipalities.geojson','centers.geojson','rankings.json','metadata.json']
try {
  const manifest = JSON.parse(readFileSync(path.join(directory,'manifest.json'),'utf8'))
  if (manifest.schemaVersion !== 1) throw new Error('Unknown manifest version')
  for (const name of expected) {
    const raw = readFileSync(path.join(directory,name))
    const hash = createHash('sha256').update(raw).digest('hex')
    if (manifest.files[name] !== hash) throw new Error('Integrity mismatch: '+name)
    JSON.parse(raw.toString('utf8'))
  }
  const metadata = JSON.parse(readFileSync(path.join(directory,'metadata.json'),'utf8'))
  console.log('Verified '+expected.length+' official data files: '+metadata.period+', '+metadata.centerCount+' centers')
} catch(error) {
  console.error('Cannot package data. Run pnpm data:build with official inputs first.',error.message)
  process.exitCode=1
}
