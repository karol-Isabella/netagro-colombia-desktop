import { useEffect, useRef, useState } from 'react'
import type { Analysis } from '@shared/analysis'
import type { Layer } from '@shared/coverage'
import type { Locale } from '@shared/contracts'
export function useAnalysis(territoryId: string, layer: Layer, locale: Locale) {
  const [result,setResult] = useState<Analysis | null>(null), [busy,setBusy] = useState(false), [failed,setFailed] = useState(false)
  const token = useRef({ version: 0 })
  useEffect(() => { const lifecycle = token.current; lifecycle.version++; setResult(null); setBusy(false); setFailed(false); return () => { lifecycle.version++ } }, [territoryId,layer,locale])
  async function run(online: boolean) {
    const request = ++token.current.version
    setBusy(true); setFailed(false)
    try {
      const response = await window.netAgro?.analyze({ territoryId, layer, locale, online })
      if (request !== token.current.version) return
      if (response?.ok) setResult(response.data)
      else setFailed(true)
    } catch { if (request === token.current.version) setFailed(true) }
    finally { if (request === token.current.version) setBusy(false) }
  }
  return { result, busy, failed, run }
}
