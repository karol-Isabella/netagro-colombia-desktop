import { useState } from 'react'
import type { Layer } from '@shared/coverage'
export function useExport() {
  const [status,setStatus] = useState<'idle' | 'busy' | 'exported' | 'exportCancelled' | 'exportFailed'>('idle')
  async function run(territoryId: string,layer: Layer,kind: 'rankings' | 'centers') {
    setStatus('busy')
    try {
      const result = await window.netAgro?.exportCsv({ territoryId,layer,kind })
      setStatus(result?.ok ? (result.data.saved ? 'exported' : 'exportCancelled') : 'exportFailed')
    } catch { setStatus('exportFailed') }
  }
  return { status,run }
}
