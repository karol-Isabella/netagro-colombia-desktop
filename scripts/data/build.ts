import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as shapefile from 'shapefile'
import { simplify } from '@turf/turf'
import { aggregateTerritory, normalizeCode, normalizeName, rankTerritories } from '../../src/shared/coverage'
import { datasetSchema, collectionSchema, type MapCollection } from '../../src/shared/dataSchema'
import { processCoverage } from './csv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const raw = path.join(root, 'data/raw'), cartography = path.join(raw, 'MGN2024_00_COLOMBIA')
const inputs = {
  csv: path.join(raw, 'Datos_Cobertura_Movil_1T_2023-4T_2025.csv'),
  departments: path.join(cartography, 'ADMINISTRATIVO/MGN_ADM_DPTO_POLITICO'),
  municipalities: path.join(cartography, 'ADMINISTRATIVO/MGN_ADM_MPIO_GRAFICO'),
  blocks: path.join(cartography, 'URBANO/MGN_URB_MANZANA'),
}
async function hash(file: string): Promise<string> {
  const value = createHash('sha256')
  for await (const chunk of createReadStream(file)) value.update(chunk)
  return value.digest('hex')
}
async function boundaries(file: string, level: 'department' | 'municipality'): Promise<MapCollection> {
  const projection = await readFile(file + '.prj', 'utf8')
  if (!projection.includes('GCS_WGS_1984')) throw new Error(`Unsupported projection: ${file}`)
  const source = await shapefile.open(file + '.shp', file + '.dbf', { encoding: 'utf-8' })
  const features: MapCollection['features'] = []
  while (true) {
    const item = await source.read()
    if (item.done) break
    const p = item.value.properties as Record<string, unknown>
    if (Number(p[level === 'department' ? 'dpto_nano' : 'mpio_nano']) !== 2024) throw new Error('Unexpected DANE vintage')
    const id = normalizeCode(String(p[level === 'department' ? 'dpto_ccdgo' : 'mpio_cdpmp']), level === 'department' ? 2 : 5)
    const simplified = simplify(item.value, { tolerance: 0.002, highQuality: true, mutate: true })
    features.push(collectionSchema.shape.features.element.parse({
      type: 'Feature', id, geometry: simplified.geometry,
      properties: { id, name: normalizeName(String(p[level === 'department' ? 'dpto_cnmbr' : 'mpio_cnmbr'])), parentId: level === 'department' ? 'CO' : id.slice(0, 2) },
    }))
  }
  return { type: 'FeatureCollection', features: features.sort((a,b) => a.id.localeCompare(b.id)) }
}
async function blockCoordinates() {
  const sums = new Map<string, { x: number; y: number; area: number }>()
  const source = await shapefile.openDbf(inputs.blocks + '.dbf', { encoding: 'utf-8' })
  while (true) {
    const item = await source.read()
    if (item.done) break
    const p = item.value as Record<string, unknown>
    const id = normalizeCode(String(p.zu_cdivi), 8), x = Number(p.manz_long), y = Number(p.manz_lati), area = Number(p.manz_narea)
    if (![x,y,area].every(Number.isFinite) || x < -82 || x > -66 || y < -5 || y > 14 || area <= 0) continue
    const sum = sums.get(id) ?? { x: 0, y: 0, area: 0 }
    sum.x += x * area; sum.y += y * area; sum.area += area; sums.set(id, sum)
  }
  return new Map([...sums].map(([id,s]) => [id, [s.x / s.area, s.y / s.area] as [number,number]]))
}
console.log('Reading official coverage CSV (streaming, latest quarter)...')
const result = await processCoverage(inputs.csv)
console.log(`Selected ${result.period}: ${result.centers.length} centers. Reading DANE 2024...`)
const departments = await boundaries(inputs.departments, 'department')
const municipalities = await boundaries(inputs.municipalities, 'municipality')
const coordinates = await blockCoordinates()
for (const c of result.centers) c.coordinates = coordinates.get(c.id) ?? null
const municipalIds = new Set(municipalities.features.map(f => f.id))
const unmatched = result.centers.filter(c => !municipalIds.has(c.municipalityId))
if (unmatched.length) result.warnings.push(`${unmatched.length} coverage centers do not match a DANE municipality polygon.`)
const territories = [
  aggregateTerritory({ id: 'CO', name: 'Colombia', level: 'country', parentId: null }, result.centers),
  ...departments.features.map(f => aggregateTerritory({ ...f.properties, level: 'department' }, result.centers.filter(c => c.departmentId === f.id))),
  ...municipalities.features.map(f => aggregateTerritory({ ...f.properties, level: 'municipality' }, result.centers.filter(c => c.municipalityId === f.id))),
]
const located = result.centers.filter(c => c.coordinates !== null)
const centers: MapCollection = { type: 'FeatureCollection', features: located.map(c => ({ type: 'Feature', id: c.id,
  geometry: { type: 'Point', coordinates: c.coordinates! }, properties: { id: c.id, name: c.name, parentId: c.municipalityId } })) }
const sourceHashes: Record<string, string> = {}
for (const file of [inputs.csv, inputs.departments+'.shp', inputs.departments+'.dbf', inputs.municipalities+'.shp', inputs.municipalities+'.dbf', inputs.blocks+'.dbf']) {
  sourceHashes[path.relative(root, file).replaceAll('\\', '/')] = await hash(file)
}
const metadata = {
  schemaVersion: 1, generatedAt: new Date().toISOString(), period: result.period, periods: result.periods,
  csvRows: result.csvRows, selectedRows: result.selectedRows, duplicateRows: result.duplicateRows,
  centerCount: result.centers.length, locatedCenters: located.length, explicitNoneCount: result.centers.filter(c => c.explicitNone).length,
  sourceHashes, pointMethod: 'DANE block area-weighted coordinates',
  warnings: [...result.warnings, `${result.centers.length - located.length} centers have no matching block coordinates; omitted from point map, retained in metrics.`],
  methodology: 'Latest quarter only. Signal-level areas summed separately per operator and technology, capped by center area; best operator chosen per center. Territory coverage is area-weighted over centers reporting each technology. Missing reports are null, not zero. Ninguna and zero coverage across all reported technologies identify uncovered centers. None layer is the area share of fully uncovered centers, not exact uncovered surface. Point locations are approximate block-area-weighted coordinates, not surveyed center centroids. Areas are in km² as supplied by CRC, not population or municipal land coverage.',
}
const dataset = datasetSchema.parse({ metadata, territories, centers: result.centers })
const output = path.join(root, 'data/processed')
await mkdir(output, { recursive: true })
const files: Record<string, unknown> = { 'coverage.json': dataset, 'departments.geojson': departments, 'municipalities.geojson': municipalities,
  'centers.geojson': centers, 'rankings.json': rankTerritories(territories.filter(t => t.level === 'municipality'), '4G'), 'metadata.json': metadata }
for (const [name, value] of Object.entries(files)) {
  const target = path.join(output, name), temporary = target + '.tmp'
  await writeFile(temporary, JSON.stringify(value))
  await rename(temporary, target)
}
await rm(path.join(output, 'manifest.json'), { force: true })
const hashes: Record<string,string> = {}
for (const name of Object.keys(files)) hashes[name] = await hash(path.join(output,name))
await writeFile(path.join(output,'manifest.json'), JSON.stringify({ schemaVersion: 1, files: hashes }))
console.log(JSON.stringify({ period: result.period, centers: result.centers.length, located: located.length, territories: territories.length, warnings: metadata.warnings }, null, 2))
