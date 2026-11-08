import { useEffect, useState } from 'react'
import { appInfoSchema, type AppInfo } from '@shared/contracts'

type InfoState = { status: 'loading' | 'unavailable' | 'preview' } | { status: 'ready'; info: AppInfo }

export function useAppInfo(): InfoState {
  const [state, setState] = useState<InfoState>({ status: 'loading' })
  useEffect(() => {
    let active = true
    const api = window.netAgro
    if (!api) {
      setState({ status: 'preview' })
      return
    }
    void api.getAppInfo().then((result) => {
      const info = appInfoSchema.parse(result)
      if (active) setState({ status: 'ready', info })
    }).catch(() => {
      if (active) setState({ status: 'unavailable' })
    })
    return () => { active = false }
  }, [])
  return state
}
