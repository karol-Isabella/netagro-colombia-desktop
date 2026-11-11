import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as LibreMap, NavigationControl, Popup, setWorkerUrl, type GeoJSONSource, type FilterSpecification, type ExpressionSpecification } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { bbox } from '@turf/turf'
import { useCoverageStore } from '@renderer/services/coverageStore'
import { mapView } from '@renderer/services/selectors'
import { useTranslation } from '@renderer/i18n/useTranslation'
import { usePreferences } from '@renderer/preferences/usePreferences'
import type { Layer } from '@shared/coverage'
import type { ReliefCollection } from '@shared/dataSchema'
import 'maplibre-gl/dist/maplibre-gl.css'
setWorkerUrl(workerUrl)

function coverageFill(layer: Layer, dark: boolean): ExpressionSpecification {
  const colors = dark
    ? { missing: '#34494b', low: '#92714a', medium: '#827747', high: '#4e8065', best: '#62a77b' }
    : { missing: '#d8ddd2', low: '#d8a477', medium: '#e5c766', high: '#a9d3a7', best: '#4f9a72' }
  if (layer === 'none') return ['case', ['<', ['get', 'value'], 0], colors.missing, ['interpolate', ['linear'], ['get', 'value'], 0, colors.medium, 0.1, colors.low, 1, colors.low]] as ExpressionSpecification
  return ['case', ['<', ['get', 'value'], 0], colors.missing, ['interpolate', ['linear'], ['get', 'value'], 0, colors.low, 0.5, colors.medium, 0.9, colors.high, 1, colors.best]] as ExpressionSpecification
}

export function CoverageMap() {
  const host = useRef<HTMLDivElement>(null), map = useRef<LibreMap | null>(null)
  const [loaded, setLoaded] = useState(false), [failed, setFailed] = useState(false)
  const [relief, setRelief] = useState<ReliefCollection | null>(null)
  const { data, maps, selectedId, centerId, layer, heatmap, band, select, selectCenter } = useCoverageStore()
  const t = useTranslation()
  const { theme } = usePreferences()
  const view = useMemo(() => data && maps ? mapView(data, maps, selectedId, layer) : null, [data, maps, selectedId, layer])
  useEffect(() => {
    if (!host.current) return
    setLoaded(false)
    setFailed(false)
    let instance: LibreMap
    const dark = document.documentElement.classList.contains('dark')
    try {
      instance = new LibreMap({ container: host.current, style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#f3f0e8' } }] },
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
      instance.addSource('relief', { type: 'geojson', data: empty })
      instance.addLayer({ id: 'coverage-fill', type: 'fill', source: 'territories', paint: { 'fill-color': coverageFill('4G', dark), 'fill-opacity': 0.9 } })
      instance.addLayer({ id: 'contours-minor', type: 'line', source: 'relief', filter: ['==', ['get', 'major'], false], minzoom: 3,
        paint: { 'line-color': dark ? '#82998b' : '#637b67', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.22, 7, 0.55, 11, 0.9], 'line-opacity': 0.26 } })
      instance.addLayer({ id: 'contours-major', type: 'line', source: 'relief', filter: ['==', ['get', 'major'], true], minzoom: 3,
        paint: { 'line-color': dark ? '#9caf9e' : '#526f58', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.42, 7, 0.8, 11, 1.15], 'line-opacity': 0.48 } })
      instance.addLayer({ id: 'borders', type: 'line', source: 'territories', paint: { 'line-color': dark ? '#293c41' : '#fffdf6', 'line-width': 1.4 } })
      instance.addLayer({ id: 'selected-border', type: 'line', source: 'territories', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': dark ? '#d8a84e' : '#355f4c', 'line-width': 3, 'line-opacity': 0.95 } })
      instance.addLayer({ id: 'selected-department-border', type: 'line', source: 'selected-department', paint: { 'line-color': dark ? '#d8a84e' : '#355f4c', 'line-width': 4, 'line-opacity': 0.95 } })
      instance.addLayer({ id: 'heat', type: 'heatmap', source: 'centers', filter: ['==', ['get', 'none'], true], paint: { 'heatmap-radius': 28, 'heatmap-opacity': 0.65 } })
      instance.addLayer({ id: 'center-points', type: 'circle', source: 'centers', minzoom: 7,
        paint: { 'circle-color': ['case', ['get', 'none'], '#d8a84e', dark ? '#75afbd' : '#1d6083'], 'circle-radius': 4, 'circle-stroke-width': 1, 'circle-stroke-color': dark ? '#182328' : '#fff' } })
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
  }, [select, selectCenter, theme])
  useEffect(() => {
    let active = true
    const api = window.netAgro
    if (loaded && api?.getRelief) {
      void api.getRelief().then((result) => {
        if (active && result.ok) setRelief(result.data)
      })
    }
    return () => { active = false }
  }, [loaded])
  useEffect(() => {
    if (!loaded) return
    const updateTheme = () => {
      const instance = map.current
      if (!instance) return
      const dark = document.documentElement.classList.contains('dark')
      instance.setPaintProperty('background', 'background-color', getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#f3f0e8')
      instance.setPaintProperty('coverage-fill', 'fill-color', coverageFill(layer, dark))
      instance.setPaintProperty('borders', 'line-color', dark ? '#293c41' : '#fffdf6')
      instance.setPaintProperty('selected-border', 'line-color', dark ? '#d8a84e' : '#355f4c')
      instance.setPaintProperty('selected-department-border', 'line-color', dark ? '#d8a84e' : '#355f4c')
      instance.setPaintProperty('contours-minor', 'line-color', dark ? '#82998b' : '#637b67')
      instance.setPaintProperty('contours-major', 'line-color', dark ? '#9caf9e' : '#526f58')
      instance.setPaintProperty('center-points', 'circle-color', ['case', ['get', 'none'], '#d8a84e', dark ? '#75afbd' : '#1d6083'])
      instance.setPaintProperty('center-points', 'circle-stroke-color', dark ? '#182328' : '#fff')
    }
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    updateTheme()
    return () => observer.disconnect()
  }, [loaded, layer])
  useEffect(() => {
    const instance = map.current
    if (!loaded || !instance || !view) return
    host.current?.setAttribute('data-rendered', 'false')
    ;(instance.getSource('territories') as GeoJSONSource).setData(view.polygons)
    const dark = document.documentElement.classList.contains('dark')
    instance.setPaintProperty('background', 'background-color', getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#f3f0e8')
    instance.setPaintProperty('coverage-fill', 'fill-color', coverageFill(layer, dark))
    instance.setPaintProperty('borders', 'line-color', dark ? '#293c41' : '#fffdf6')
    instance.setPaintProperty('selected-border', 'line-color', dark ? '#d8a84e' : '#355f4c')
    instance.setPaintProperty('selected-department-border', 'line-color', dark ? '#d8a84e' : '#355f4c')
    instance.setPaintProperty('contours-minor', 'line-color', dark ? '#82998b' : '#637b67')
    instance.setPaintProperty('contours-major', 'line-color', dark ? '#9caf9e' : '#526f58')
    instance.setPaintProperty('center-points', 'circle-color', ['case', ['get', 'none'], '#d8a84e', dark ? '#75afbd' : '#1d6083'])
    instance.setPaintProperty('center-points', 'circle-stroke-color', dark ? '#182328' : '#fff')
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
  }, [loaded, view, heatmap, band, layer, maps, selectedId, theme])
  useEffect(() => {
    if (!loaded || !map.current || !relief) return
    ;(map.current.getSource('relief') as GeoJSONSource).setData(relief)
    host.current?.setAttribute('data-relief-features', String(relief.features.length))
  }, [loaded, relief])
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
