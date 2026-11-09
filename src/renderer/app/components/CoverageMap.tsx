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
      instance = new LibreMap({ container: host.current, style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e6eef0' } }] },
        center: [-73.6, 4.8], zoom: 4.4, minZoom: 3, maxZoom: 17, attributionControl: false,
        transformRequest: () => { throw new Error('Remote map resources are disabled') } })
    } catch { setFailed(true); return }
    map.current = instance
    instance.addControl(new NavigationControl(), 'top-right')
    instance.on('load', () => {
      const empty = { type: 'FeatureCollection' as const, features: [] }
      instance.addSource('territories', { type: 'geojson', data: empty })
      instance.addSource('centers', { type: 'geojson', data: empty })
      instance.addLayer({ id: 'coverage-fill', type: 'fill', source: 'territories', paint: { 'fill-color': ['case', ['<', ['get', 'value'], 0], '#aeb8bd', ['interpolate', ['linear'], ['get', 'value'], 0, '#c8463b', 0.5, '#e6bb5b', 0.9, '#79b991', 1, '#24654e']], 'fill-opacity': 0.8 } })
      instance.addLayer({ id: 'borders', type: 'line', source: 'territories', paint: { 'line-color': '#3f585c', 'line-width': 0.8 } })
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
    ;(instance.getSource('centers') as GeoJSONSource).setData(view.points)
    instance.setLayoutProperty('heat', 'visibility', heatmap ? 'visible' : 'none')
    const filter: FilterSpecification | null = band === 'all' ? null : band === 'unknown' ? ['<', ['get', 'value'], 0] :
      band === 'low' ? ['all', ['>=', ['get','value'], 0], ['<', ['get','value'], 0.5]] :
      band === 'medium' ? ['all', ['>=', ['get','value'], 0.5], ['<', ['get','value'], 0.9]] : ['>=', ['get','value'], 0.9]
    instance.setFilter('coverage-fill', filter)
    instance.setPaintProperty('coverage-fill', 'fill-color', layer === 'none' ?
      ['case', ['<', ['get','value'], 0], '#aeb8bd', ['interpolate', ['linear'], ['get','value'], 0, '#e3ece7', 0.1, '#e6bb5b', 1, '#b72d2d']] :
      ['case', ['<', ['get','value'], 0], '#aeb8bd', ['interpolate', ['linear'], ['get','value'], 0, '#c8463b', 0.5, '#e6bb5b', 0.9, '#79b991', 1, '#24654e']])
  }, [loaded, view, heatmap, band, layer])
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
