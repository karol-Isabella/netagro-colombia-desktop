import type { Dataset } from '@shared/dataSchema'
import { rankTerritories, layerValue, type Layer } from '@shared/coverage'
export function csvCell(value: string | number | null): string {
  let text = value === null ? '' : String(value)
  if (typeof value === 'string' && /^\s*[=+\-@\t\r\n]/.test(text)) text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}
export function rankingCsv(data: Dataset, territoryId: string, layer: Layer): string {
  const territory = data.territories.find(t => t.id === territoryId)
  if (!territory) throw new Error('INVALID_INPUT')
  const candidates = territory.level === 'municipality' ? [territory] :
    data.territories.filter(t => t.level === 'municipality' && (territoryId === 'CO' || t.parentId === territoryId))
  const header = ['period', 'dane_code', 'name', 'technology', 'coverage_fraction', 'center_count', 'uncovered_centers', 'center_area_km2']
  return '\uFEFF' + [header, ...rankTerritories(candidates, layer).map(t => [data.metadata.period, t.id, t.name, layer, layerValue(t, layer), t.centerCount, t.uncoveredCenters, t.area])]
    .map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n'
}

export function centersCsv(data: Dataset, territoryId: string, layer: Layer): string {
  const territory = data.territories.find(t => t.id === territoryId)
  if (!territory) throw new Error('INVALID_INPUT')
  const centers = data.centers.filter(c => territoryId === 'CO' || (territory.level === 'department' ? c.departmentId === territoryId : c.municipalityId === territoryId))
  const header = ['period','dane_code','name','municipality','technology','coverage_fraction','area_km2','no_coverage','longitude','latitude']
  return '\uFEFF' + [header,...centers.map(c => [data.metadata.period,c.id,c.name,c.municipalityId,layer,layer === 'none' ? (c.none ? 1 : 0) : c.coverage[layer],c.area,c.none ? 1 : 0,c.coordinates?.[0] ?? null,c.coordinates?.[1] ?? null])]
    .map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n'
}
