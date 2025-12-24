import { Outlet } from 'react-router-dom';
import { BRANDING } from '../config/branding';
import { ModeTabs } from './ModeTabs';
import { StatusPill } from './StatusPill';
import { ThemeToggle } from './ThemeToggle';
import { Footer } from './Footer';
import { useLiquidationMap } from '../lib/queries';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/utils';

export function AppShell() {
  const { isLoading, isError, error, isStale } = useLiquidationMap();
  const { theme } = useTheme();

  let pillStatus: 'initializing' | 'ready' | 'error' | 'stale';
  let pillMessage: string | undefined;

  if (isLoading) {
    pillStatus = 'initializing';
    pillMessage = 'Loading liquidation data...';
  } else if (isError) {
    pillStatus = 'error';
    pillMessage = error?.message || 'Failed to load data';
  } else if (isStale) {
    pillStatus = 'stale';
    pillMessage = 'Data may be outdated';
  } else {
    pillStatus = 'ready';
    pillMessage = 'Data is up to date';
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Navbar */}
      <nav className="bg-surface backdrop-blur-sm sticky top-0 z-50 border-purple-500/20 dark:border-purple-400/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3 relative">
              {/* Logo with crossfade effect */}
              <div className="relative h-8" style={{ width: '200px' }}>
                <img
                  key={`logo-white-${theme}`}
                  src={BRANDING.LOGO_WHITE}
                  alt={BRANDING.APP_NAME}
                  className="absolute inset-0 h-full object-contain object-left transition-opacity duration-300"
                  style={{
                    opacity: theme === 'dark' ? 1 : 0,
                    pointerEvents: theme === 'dark' ? 'auto' : 'none',
                  }}
                />
                <img
                  key={`logo-black-${theme}`}
                  src={BRANDING.LOGO_BLACK}
                  alt={BRANDING.APP_NAME}
                  className="absolute inset-0 h-full object-contain object-left transition-opacity duration-300"
                  style={{
                    opacity: theme === 'light' ? 1 : 0,
                    pointerEvents: theme === 'light' ? 'auto' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Mode Tabs - Center */}
            <div className="flex-1 flex justify-center">
              <ModeTabs />
            </div>

            {/* Status + Theme Toggle */}
            <div className="flex items-center gap-3">
              <StatusPill status={pillStatus} message={pillMessage} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1 flex flex-col justify-center">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}


