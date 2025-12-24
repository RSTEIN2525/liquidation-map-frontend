import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/AppShell';
import { CrossSectionalPage } from './pages/CrossSectionalPage';
import { HeatmapPage } from './pages/HeatmapPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { ThemeProvider, initTheme } from './lib/theme';

// Initialize theme on app load
initTheme();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/cross-sectional" replace />} />
              <Route path="cross-sectional" element={<CrossSectionalPage />} />
              <Route path="heatmap" element={<HeatmapPage />} />
              <Route path="accuracy" element={<AccuracyPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}


