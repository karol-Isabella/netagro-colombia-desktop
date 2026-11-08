import type { FeatureCollection, Geometry } from 'geojson'
import type { Dataset, MapData } from '@shared/dataSchema'
import { layerValue, rankTerritories, type Layer, type Territory } from '@shared/coverage'
export function territoryView(data: Dataset, id: string) {
  const territory = data.territories.find(t => t.id === id) ?? data.territories[0]
  const centers = data.centers.filter(c => id === 'CO' || (territory.level === 'department' ? c.departmentId === id : c.municipalityId === id))
  const crumbs: Territory[] = [data.territories[0]]
  if (territory.level === 'municipality') {
    const parent = data.territories.find(t => t.id === territory.parentId)
    if (parent) crumbs.push(parent)
  }
  if (id !== 'CO') crumbs.push(territory)
  return { territory, centers, crumbs, children: data.territories.filter(t => t.parentId === id) }
}
export function searchTerritories(data: Dataset, query: string): Territory[] {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const needle = normalize(query.trim())
  if (!needle) return []
  return data.territories.filter(t => normalize(t.name).includes(needle) || t.id.startsWith(needle)).slice(0, 20)
}
export function mapView(data: Dataset, maps: MapData, id: string, layer: Layer) {
  const view = territoryView(data, id), index = new Map(data.territories.map(t => [t.id, t]))
  const collection = id === 'CO' ? maps.departments : maps.municipalities
  const polygons: FeatureCollection<Geometry> = { type: 'FeatureCollection', features: collection.features
    .filter(f => id === 'CO' || (view.territory.level === 'department' ? f.properties.parentId === id : f.id === id))
    .map(f => ({ ...f, properties: { ...f.properties, value: index.has(f.id) ? layerValue(index.get(f.id)!, layer) ?? -1 : -1 } })) }
  const byId = new Map(view.centers.map(c => [c.id, c]))
  const points: FeatureCollection<Geometry> = { type: 'FeatureCollection', features: maps.centers.features.filter(f => byId.has(f.id)).map(f => {
    const c = byId.get(f.id)!
    return { ...f, properties: { ...f.properties, none: c.none, value: layer === 'none' ? (c.none ? 1 : 0) : c.coverage[layer] ?? -1 } }
  }) }
  return { polygons, points }
}
export function rankings(data: Dataset, id: string, layer: Layer) {
  const territory = territoryView(data,id).territory
  return rankTerritories(data.territories.filter(t => t.level === 'municipality' &&
    (id === 'CO' || t.parentId === id || (territory.level === 'municipality' && t.id === id))), layer)
}
export function percent(value: number | null, locale: string): string {
  return value === null ? '—' : new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', { style: 'percent', maximumFractionDigits: 1 }).format(value)
}
