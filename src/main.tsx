import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { bindAppearance } from '@renderer/preferences/appearance'
import { preferencesStore } from '@renderer/preferences/usePreferences'
import './index.css'

// Apply the saved appearance before React's first paint.
const dispose = bindAppearance(preferencesStore.getState, preferencesStore.subscribe,
  window.matchMedia('(prefers-color-scheme: dark)'), document.documentElement)
dispose()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
