import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@renderer/components/AppShell'
import { AuthGate } from '@renderer/components/AuthGate'
import { WorkspacePage } from '@renderer/pages/WorkspacePage'
import { CoveragePage } from '@renderer/pages/CoveragePage'
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
      <AuthGate>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<CoveragePage title="overview" />} />
          <Route path="coverage" element={<CoveragePage title="coverage" />} />
          <Route path="map" element={<CoveragePage />} />
          <Route path="reports" element={<WorkspacePage section="reports" />} />
          <Route path="route-analysis" element={<WorkspacePage section="routes" />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </AuthGate>
    </HashRouter>
  )
}
export default App
