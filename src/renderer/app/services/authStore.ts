import { create } from 'zustand'
import type { ErrorCode } from '@shared/contracts'
import { useCoverageStore } from './coverageStore'
interface AuthState {
  status: 'loading' | 'anonymous' | 'authenticated' | 'preview' | 'error'
  username: string | null; hasAccounts: boolean; error: ErrorCode | null; busy: boolean
  initialize: () => Promise<void>
  submit: (mode: 'login' | 'register', username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading', username: null, hasAccounts: false, error: null, busy: false,
  async initialize() {
    const api = window.netAgro
    if (!api?.authStatus) { set({ status: 'preview' }); return }
    try {
      const response = await api.authStatus()
      if (!response.ok) { set({ status: 'error', error: response.error }); return }
      set({ status: response.data.username ? 'authenticated' : 'anonymous', ...response.data })
    } catch { set({ status: 'error', error: 'INTERNAL' }) }
  },
  async submit(mode,username,password) {
    set({ busy: true, error: null })
    try {
      const api = window.netAgro
      const response = await (mode === 'login' ? api?.login({ username,password }) : api?.register({ username,password }))
      if (response?.ok) set({ status: 'authenticated', ...response.data })
      else set({ error: response?.error ?? 'INTERNAL' })
    } catch { set({ error: 'INVALID_INPUT' }) }
    finally { set({ busy: false }) }
  },
  async logout() {
    try {
      const response = await window.netAgro?.logout()
      if (!response?.ok) { set({ error: response?.error ?? 'INTERNAL' }); return }
      useCoverageStore.getState().reset()
      set({ status: 'anonymous', username: null, error: null })
    } catch { set({ error: 'INTERNAL' }) }
  },
}))
