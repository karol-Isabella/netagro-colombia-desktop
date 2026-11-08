import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@renderer/components/AppShell'
import { WorkspacePage } from '@renderer/pages/WorkspacePage'
import { SettingsPage } from '@renderer/pages/SettingsPage'
import { NotFoundPage } from '@renderer/pages/NotFoundPage'
import { bindAppearance } from '@renderer/preferences/appearance'
import { preferencesStore } from '@renderer/preferences/usePreferences'
import './App.css'

function App() {
  useEffect(() => bindAppearance(
    preferencesStore.getState,
    preferencesStore.subscribe,
    window.matchMedia('(prefers-color-scheme: dark)'),
    document.documentElement,
  ), [])

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<WorkspacePage section="overview" />} />
          <Route path="coverage" element={<WorkspacePage section="coverage" />} />
          <Route path="map" element={<WorkspacePage section="map" />} />
          <Route path="reports" element={<WorkspacePage section="reports" />} />
          <Route path="route-analysis" element={<WorkspacePage section="routes" />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
export default App
