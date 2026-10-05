import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MainLayout } from './renderer/src/components/layout';
import {
  DashboardPage,
  CoveragePage,
  MapPage,
  RouteAnalysisPage,
  ReportsPage,
  SettingsPage,
} from './renderer/src/pages';
import { useThemeStore } from './renderer/src/stores/themeStore';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />
          <Route
            path="/coverage"
            element={
              <MainLayout>
                <CoveragePage />
              </MainLayout>
            }
          />
          <Route
            path="/map"
            element={
              <MainLayout>
                <MapPage />
              </MainLayout>
            }
          />
          <Route
            path="/route-analysis"
            element={
              <MainLayout>
                <RouteAnalysisPage />
              </MainLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <MainLayout>
                <ReportsPage />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
