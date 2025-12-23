import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

const MODES = [
  { id: 'cross-sectional', label: 'Cross Sectional', path: '/cross-sectional' },
  { id: 'heatmap', label: 'Heatmap', path: '/heatmap' },
] as const;

export function ModeTabs() {
  const location = useLocation();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-surface p-1 border border-border">
      {MODES.map((mode) => {
        const isActive = location.pathname === mode.path || 
          (location.pathname === '/' && mode.id === 'cross-sectional');
        
        return (
          <Link
            key={mode.id}
            to={mode.path}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg'
            )}
          >
            {mode.label}
          </Link>
        );
      })}
    </div>
  );
}

