import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

const MODES = [
  { id: 'cross-sectional', label: 'Cross Sectional', path: '/cross-sectional' },
  { id: 'heatmap', label: 'Heatmap', path: '/heatmap' },
  { id: 'accuracy', label: 'Accuracy', path: '/accuracy' },
] as const;

export function ModeTabs() {
  const location = useLocation();

  return (
    <div className="flex items-center gap-8">
      {MODES.map((mode) => {
        const isActive = location.pathname === mode.path || 
          (location.pathname === '/' && mode.id === 'cross-sectional');
        
        return (
          <Link
            key={mode.id}
            to={mode.path}
            className={cn(
              'group relative px-2 py-2 text-sm font-medium inline-block',
              'transition-all duration-300 ease-out',
              'hover:scale-110 hover:-translate-y-1',
              isActive
                ? 'text-purple-500 dark:text-purple-400'
                : 'text-text-secondary hover:text-purple-400 dark:hover:text-purple-300'
            )}
          >
            <span className="relative z-10">{mode.label}</span>
            
            {/* Active Underline */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 dark:bg-purple-400 origin-center"
                style={{
                  animation: 'underlineExpand 0.3s ease-out',
                }}
              />
            )}
            
            {/* Hover Underline Animation - shoots out from center */}
            {!isActive && (
              <span
                className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-purple-300 dark:bg-purple-500 origin-center transition-all duration-300 opacity-0 scale-x-0 group-hover:left-0 group-hover:right-0 group-hover:opacity-100 group-hover:scale-x-110"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}


