import { Outlet } from 'react-router-dom';
import { BRANDING } from '../config/branding';
import { ModeTabs } from './ModeTabs';
import { StatusPill } from './StatusPill';
import { ThemeToggle } from './ThemeToggle';
import { useLiquidationMap } from '../lib/queries';

export function AppShell() {
  const { isLoading, isError, error, isStale } = useLiquidationMap();

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
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <nav className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              {BRANDING.LOGO_URL && (
                <img
                  src={BRANDING.LOGO_URL}
                  alt={BRANDING.APP_NAME}
                  className="h-8 w-8"
                />
              )}
              <div>
                <h1 className="text-lg font-semibold text-text-primary">
                  {BRANDING.APP_NAME}
                </h1>
                {BRANDING.TAGLINE && (
                  <p className="text-xs text-text-tertiary">{BRANDING.TAGLINE}</p>
                )}
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
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

