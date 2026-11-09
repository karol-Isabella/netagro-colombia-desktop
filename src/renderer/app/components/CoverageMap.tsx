import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as LibreMap, NavigationControl, Popup, setWorkerUrl, type GeoJSONSource, type FilterSpecification } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { bbox } from '@turf/turf'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { mapView } from '@renderer/services/selectors'
import { useTranslation } from '@renderer/i18n/useTranslation'
import 'maplibre-gl/dist/maplibre-gl.css'
setWorkerUrl(workerUrl)

export function CoverageMap() {
  const host = useRef<HTMLDivElement>(null), map = useRef<LibreMap | null>(null)
  const [loaded, setLoaded] = useState(false), [failed, setFailed] = useState(false)
  const { data, maps, selectedId, centerId, layer, heatmap, band, select, selectCenter } = useCoverageStore()
  const t = useTranslation()
  const view = useMemo(() => data && maps ? mapView(data, maps, selectedId, layer) : null, [data, maps, selectedId, layer])
  useEffect(() => {
    if (!host.current) return
    let instance: LibreMap
    try {
      instance = new LibreMap({ container: host.current, style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f3f1e7' } }] },
        center: [-73.6, 4.8], zoom: 4.4, minZoom: 3, maxZoom: 17, attributionControl: false,
        transformRequest: () => { throw new Error('Remote map resources are disabled') } })
    } catch { setFailed(true); return }
    map.current = instance
    instance.addControl(new NavigationControl(), 'top-right')
    instance.on('load', () => {
      const empty = { type: 'FeatureCollection' as const, features: [] }
      instance.addSource('territories', { type: 'geojson', data: empty })
      instance.addSource('selected-department', { type: 'geojson', data: empty })
      instance.addSource('centers', { type: 'geojson', data: empty })
      instance.addLayer({ id: 'coverage-fill', type: 'fill', source: 'territories', paint: { 'fill-color': ['case', ['<', ['get', 'value'], 0], '#d8ddd2', ['interpolate', ['linear'], ['get', 'value'], 0, '#f3c8a1', 0.5, '#f2df91', 0.9, '#a9d3a7', 1, '#4f9a72']], 'fill-opacity': 0.9 } })
      instance.addLayer({ id: 'borders', type: 'line', source: 'territories', paint: { 'line-color': '#fffdf6', 'line-width': 1.4 } })
      instance.addLayer({ id: 'selected-border', type: 'line', source: 'territories', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': '#355f4c', 'line-width': 3, 'line-opacity': 0.95 } })
      instance.addLayer({ id: 'selected-department-border', type: 'line', source: 'selected-department', paint: { 'line-color': '#355f4c', 'line-width': 4, 'line-opacity': 0.95 } })
      instance.addLayer({ id: 'heat', type: 'heatmap', source: 'centers', filter: ['==', ['get', 'none'], true], paint: { 'heatmap-radius': 28, 'heatmap-opacity': 0.65 } })
      instance.addLayer({ id: 'center-points', type: 'circle', source: 'centers', minzoom: 7,
        paint: { 'circle-color': ['case', ['get', 'none'], '#b72d2d', '#1d6083'], 'circle-radius': 4, 'circle-stroke-width': 1, 'circle-stroke-color': '#fff' } })
      instance.on('click', 'coverage-fill', event => {
        const id = event.features?.[0]?.properties?.id as unknown
        if (typeof id === 'string') select(id)
      })
      instance.on('click', 'center-points', event => {
        const id = event.features?.[0]?.properties?.id as unknown
        const name = event.features?.[0]?.properties?.name as unknown
        if (typeof id === 'string') selectCenter(id)
        if (typeof name === 'string') new Popup().setLngLat(event.lngLat).setText(name).addTo(instance)
      })
      instance.on('mouseenter', 'coverage-fill', () => { instance.getCanvas().style.cursor = 'pointer' })
      instance.on('mouseleave', 'coverage-fill', () => { instance.getCanvas().style.cursor = '' })
      setLoaded(true)
    })
    instance.on('error', () => setFailed(true))
    instance.on('idle', () => { host.current?.setAttribute('data-rendered', 'true') })
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(host.current)
    return () => { observer.disconnect(); instance.remove(); map.current = null }
  }, [select, selectCenter])
  useEffect(() => {
    const instance = map.current
    if (!loaded || !instance || !view) return
    host.current?.setAttribute('data-rendered', 'false')
    ;(instance.getSource('territories') as GeoJSONSource).setData(view.polygons)
    const departmentBoundary = maps?.departments.features.find((feature) => feature.id === selectedId)
    ;(instance.getSource('selected-department') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: departmentBoundary ? [departmentBoundary] : [],
    })
    ;(instance.getSource('centers') as GeoJSONSource).setData(view.points)
    instance.setFilter('selected-border', ['==', ['get', 'id'], selectedId])
    instance.setLayoutProperty('heat', 'visibility', heatmap ? 'visible' : 'none')
    const filter: FilterSpecification | null = band === 'all' ? null : band === 'unknown' ? ['<', ['get', 'value'], 0] :
      band === 'low' ? ['all', ['>=', ['get','value'], 0], ['<', ['get','value'], 0.5]] :
      band === 'medium' ? ['all', ['>=', ['get','value'], 0.5], ['<', ['get','value'], 0.9]] : ['>=', ['get','value'], 0.9]
    instance.setFilter('coverage-fill', filter)
    instance.setPaintProperty('coverage-fill', 'fill-color', layer === 'none' ?
      ['case', ['<', ['get','value'], 0], '#d8ddd2', ['interpolate', ['linear'], ['get','value'], 0, '#f2df91', 0.1, '#f3c8a1', 1, '#f3c8a1']] :
      ['case', ['<', ['get','value'], 0], '#d8ddd2', ['interpolate', ['linear'], ['get','value'], 0, '#f3c8a1', 0.5, '#f2df91', 0.9, '#a9d3a7', 1, '#4f9a72']])
  }, [loaded, view, heatmap, band, layer, maps, selectedId])
  useEffect(() => {
    if (!loaded || !map.current || !data || !maps) return
    const features = mapView(data,maps,selectedId,'4G').polygons
    if (!features.features.length) return
    const bounds = bbox(features)
    map.current.fitBounds([[bounds[0],bounds[1]],[bounds[2],bounds[3]]], { padding: 35, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 })
  }, [loaded, selectedId, data, maps])
  useEffect(() => {
    const center = data?.centers.find(c => c.id === centerId)
    if (loaded && center?.coordinates) map.current?.flyTo({ center: center.coordinates, zoom: 11,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450 })
  }, [centerId, data, loaded])
  return <div className="map-wrap"><div className="coverage-map" ref={host} role="region" aria-label={t('map')} />
    {!loaded && !failed && (
      <div className="map-loading-overlay" aria-hidden="true">
        <div className="map-loading-spinner" />
      </div>
    )}
    {failed && <p role="alert" className="map-notice">{t('mapError')}</p>}
    <span className="map-credit">{t('sourceNote')}</span></div>
}
