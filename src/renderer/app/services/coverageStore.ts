import { create } from 'zustand'
import type { Dataset, MapData } from '@shared/dataSchema'
import type { Layer } from '@shared/coverage'
export type LegendBand = 'all' | 'low' | 'medium' | 'high' | 'unknown'
interface CoverageState {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'preview'
  data: Dataset | null; maps: MapData | null; selectedId: string; centerId: string | null
  layer: Layer; heatmap: boolean; band: LegendBand
  load: () => Promise<void>; reset: () => void
  select: (id: string) => void; selectCenter: (id: string | null) => void
  setLayer: (layer: Layer) => void; setBand: (band: LegendBand) => void; setHeatmap: (value: boolean) => void
}
let generation = 0
export const useCoverageStore = create<CoverageState>((set, get) => ({
  status: 'idle', data: null, maps: null, selectedId: 'CO', centerId: null, layer: '4G', heatmap: false, band: 'all',
  async load() {
    if (get().status === 'loading' || get().status === 'ready') return
    const api = window.netAgro
    if (!api?.getCoverage) { set({ status: 'preview' }); return }
    const request = ++generation
    set({ status: 'loading' })
    try {
      const [data, maps] = await Promise.all([api.getCoverage(), api.getMaps()])
      if (request !== generation) return
      if (!data.ok || !maps.ok) { set({ status: 'error' }); return }
      set({ data: data.data, maps: maps.data, status: 'ready' })
    } catch { if (request === generation) set({ status: 'error' }) }
  },
  reset() { generation++; set({ status: 'idle', data: null, maps: null, selectedId: 'CO', centerId: null }) },
  select(id) { if (get().data?.territories.some(t => t.id === id)) set({ selectedId: id, centerId: null }) },
  selectCenter: (centerId) => set({ centerId }),
  setLayer: (layer) => set({ layer, band: 'all' }),
  setBand: (band) => set({ band }), setHeatmap: (heatmap) => set({ heatmap }),
}))
